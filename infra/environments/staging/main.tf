terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "k-strong-bass-staging-tf-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    profile        = "dev-bass"
    dynamodb_table = "k-strong-bass-staging-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  profile = "dev-bass"
  region  = var.aws_region

  default_tags {
    tags = {
      Environment = "staging"
      Project     = var.project
      ManagedBy   = "terraform"
    }
  }
}

# ACM certs for CloudFront must live in us-east-1 regardless of primary region
provider "aws" {
  alias   = "us_east_1"
  profile = "dev-bass"
  region  = "us-east-1"

  default_tags {
    tags = {
      Environment = "staging"
      Project     = var.project
      ManagedBy   = "terraform"
    }
  }
}

# ── Networking ─────────────────────────────────────────────────────────────

module "networking" {
  source      = "../../modules/networking"
  project     = var.project
  environment = var.environment
}

# ── Cognito ────────────────────────────────────────────────────────────────

module "cognito" {
  source        = "../../modules/cognito"
  project       = var.project
  environment   = var.environment
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls
}

# ── DynamoDB ───────────────────────────────────────────────────────────────

module "dynamodb" {
  source                = "../../modules/dynamodb"
  project               = var.project
  environment           = var.environment
  authenticated_role_id = module.cognito.authenticated_role_id
}

# ── DNS + ACM cert ─────────────────────────────────────────────────────────
# Creates the staging.k-strong-bass.com hosted zone and a validated cert.
#
# After first apply, run:
#   terraform output name_servers
# Then add NS delegation records in the prod-bass account's k-strong-bass.com
# zone pointing staging.k-strong-bass.com to these name servers.

module "dns" {
  source      = "../../modules/dns"
  project     = var.project
  environment = var.environment
  domain_name = var.domain_name

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}

# ── CloudFront + S3 ────────────────────────────────────────────────────────

module "cloudfront" {
  source              = "../../modules/s3-cloudfront"
  project             = var.project
  environment         = var.environment
  domain_aliases      = [var.domain_name]
  acm_certificate_arn = module.dns.acm_certificate_arn
}

# ── Route53 alias records → CloudFront ────────────────────────────────────
# Created here (not inside the dns module) to avoid a circular dependency:
# dns module outputs the cert ARN that cloudfront needs, and cloudfront
# outputs the domain name that these records need.

resource "aws_route53_record" "cloudfront_a" {
  zone_id = module.dns.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = module.cloudfront.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cloudfront_aaaa" {
  zone_id = module.dns.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = module.cloudfront.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

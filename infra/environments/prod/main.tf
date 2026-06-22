terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "k-strong-bass-prod-tf-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    profile        = "prod-bass"
    dynamodb_table = "k-strong-bass-prod-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  profile = "prod-bass"
  region  = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = var.project
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias   = "us_east_1"
  profile = "prod-bass"
  region  = "us-east-1"

  default_tags {
    tags = {
      Environment = "prod"
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
# Creates the k-strong-bass.com hosted zone and a cert covering both the
# apex domain and www.
#
# After first apply, run:
#   terraform output name_servers
# Then update your registrar's nameservers to these four values.

module "dns" {
  source      = "../../modules/dns"
  project     = var.project
  environment = var.environment
  domain_name = var.domain_name

  # Cert covers both apex and www so CloudFront can serve either
  subject_alternative_names = ["www.${var.domain_name}"]

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
  domain_aliases      = [var.domain_name, "www.${var.domain_name}"]
  acm_certificate_arn = module.dns.acm_certificate_arn
}

# ── Route53 alias records → CloudFront ────────────────────────────────────
# Apex domain

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

# www redirect — same CloudFront distribution handles both aliases
resource "aws_route53_record" "www_a" {
  zone_id = module.dns.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = module.cloudfront.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_aaaa" {
  zone_id = module.dns.zone_id
  name    = "www.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = module.cloudfront.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# ── NS delegation for staging subdomain ───────────────────────────────────
# After deploying staging, paste its name_servers output here and apply.
# This delegates staging.k-strong-bass.com DNS to the dev-bass account.

# resource "aws_route53_record" "staging_ns" {
#   zone_id = module.dns.zone_id
#   name    = "staging.${var.domain_name}"
#   type    = "NS"
#   ttl     = 300
#   records = [
#     "ns-xxxx.awsdns-xx.com.",
#     "ns-xxxx.awsdns-xx.net.",
#     "ns-xxxx.awsdns-xx.co.uk.",
#     "ns-xxxx.awsdns-xx.org.",
#   ]
# }

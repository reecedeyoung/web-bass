terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
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

# API token read from CLOUDFLARE_API_TOKEN environment variable
provider "cloudflare" {}

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

# ── ACM cert — validated via Cloudflare DNS ────────────────────────────────

module "dns" {
  source      = "../../modules/dns"
  project     = var.project
  environment = var.environment
  domain_name = var.domain_name

  subject_alternative_names = ["www.${var.domain_name}"]
  cloudflare_zone_id        = var.cloudflare_zone_id

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
    cloudflare    = cloudflare
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

# ── CI/CD deploy role ──────────────────────────────────────────────────────

module "cicd_role" {
  source                     = "../../modules/cicd-role"
  project                    = var.project
  environment                = var.environment
  s3_bucket_arn              = module.cloudfront.s3_bucket_arn
  cloudfront_distribution_id = module.cloudfront.cloudfront_distribution_id
  github_subject_claim       = var.github_subject_claim
}

# ── Cloudflare DNS records → CloudFront ───────────────────────────────────
# proxied = false — CloudFront handles SSL; Cloudflare proxy would conflict.

resource "cloudflare_record" "apex" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = module.cloudfront.cloudfront_domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = false
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  content = module.cloudfront.cloudfront_domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = false
}

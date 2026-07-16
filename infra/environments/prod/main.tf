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

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ── Cognito ────────────────────────────────────────────────────────────────

module "cognito" {
  source        = "../../modules/cognito"
  project       = var.project
  environment   = var.environment
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  google_client_id        = var.google_client_id
  google_client_secret    = var.google_client_secret
  facebook_app_id         = var.facebook_app_id
  facebook_app_secret     = var.facebook_app_secret
  apple_service_id        = var.apple_service_id
  apple_team_id           = var.apple_team_id
  apple_key_id            = var.apple_key_id
  apple_private_key       = var.apple_private_key
  microsoft_client_id     = var.microsoft_client_id
  microsoft_client_secret = var.microsoft_client_secret
}

# ── DynamoDB ───────────────────────────────────────────────────────────────

module "dynamodb" {
  source                = "../../modules/dynamodb"
  project               = var.project
  environment           = var.environment
  authenticated_role_id = module.cognito.authenticated_role_id
}

# ── API (Lambda + API Gateway) ─────────────────────────────────────────────

data "aws_caller_identity" "current" {}

module "api" {
  source      = "../../modules/api"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
  account_id  = data.aws_caller_identity.current.account_id

  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_user_pool_client_id = module.cognito.user_pool_client_id
  cognito_identity_pool_id    = module.cognito.identity_pool_id

  presets_table_name           = module.dynamodb.presets_table_name
  presets_table_arn            = module.dynamodb.presets_table_arn
  keyboard_mappings_table_name = module.dynamodb.keyboard_mappings_table_name
  keyboard_mappings_table_arn  = module.dynamodb.keyboard_mappings_table_arn

  cors_allow_origins = ["https://web-bass.com", "https://www.web-bass.com"]
  lambda_zip_path    = "${path.module}/../../../lambda/api/api.zip"
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
  api_gateway_url     = module.api.api_gateway_url
}

# ── CI/CD deploy role ──────────────────────────────────────────────────────

module "cicd_role" {
  source                     = "../../modules/cicd-role"
  project                    = var.project
  environment                = var.environment
  s3_bucket_arn              = module.cloudfront.s3_bucket_arn
  cloudfront_distribution_id = module.cloudfront.cloudfront_distribution_id
  github_subject_claim       = var.github_subject_claim
  lambda_function_name       = module.api.lambda_function_name
}

# ── RUM ───────────────────────────────────────────────────────────────────────

module "rum" {
  source      = "../../modules/rum"
  project     = var.project
  environment = var.environment
  domain      = var.domain_name
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

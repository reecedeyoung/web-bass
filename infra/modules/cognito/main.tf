# ── User Pool ──────────────────────────────────────────────────────────────

resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-${var.environment}"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "K-Strong Bass — verify your email"
    email_message        = "Your verification code is {####}"
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 3
      max_length = 254
    }
  }

  tags = {
    Name = "${var.project}-${var.environment}-user-pool"
  }
}

# ── Social identity providers (count-gated — enabled when credentials set) ─

resource "aws_cognito_identity_provider" "google" {
  count         = var.google_client_id != "" ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "email profile openid"
    attributes_url_add_identifier = "false"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
    picture  = "picture"
  }
}

resource "aws_cognito_identity_provider" "facebook" {
  count         = var.facebook_app_id != "" ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Facebook"
  provider_type = "Facebook"

  provider_details = {
    client_id        = var.facebook_app_id
    client_secret    = var.facebook_app_secret
    authorize_scopes = "email public_profile"
    api_version      = "v17.0"
  }

  attribute_mapping = {
    email    = "email"
    username = "id"
    name     = "name"
  }
}

resource "aws_cognito_identity_provider" "apple" {
  count         = var.apple_service_id != "" ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "SignInWithApple"
  provider_type = "SignInWithApple"

  provider_details = {
    client_id        = var.apple_service_id
    team_id          = var.apple_team_id
    key_id           = var.apple_key_id
    private_key      = var.apple_private_key
    authorize_scopes = "email name"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

resource "aws_cognito_identity_provider" "microsoft" {
  count         = var.microsoft_client_id != "" ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Microsoft"
  provider_type = "OIDC"

  provider_details = {
    client_id                 = var.microsoft_client_id
    client_secret             = var.microsoft_client_secret
    attributes_request_method = "GET"
    oidc_issuer               = "https://login.microsoftonline.com/common/v2.0"
    authorize_scopes          = "email profile openid"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

locals {
  enabled_providers = compact([
    "COGNITO",
    var.google_client_id    != "" ? "Google"          : "",
    var.facebook_app_id     != "" ? "Facebook"        : "",
    var.apple_service_id    != "" ? "SignInWithApple"  : "",
    var.microsoft_client_id != "" ? "Microsoft"       : "",
  ])
}

# ── User Pool Client (SPA — no secret) ────────────────────────────────────

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project}-${var.environment}-web"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
  ]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  supported_identity_providers = local.enabled_providers

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  prevent_user_existence_errors = "ENABLED"

  depends_on = [
    aws_cognito_identity_provider.google,
    aws_cognito_identity_provider.facebook,
    aws_cognito_identity_provider.apple,
    aws_cognito_identity_provider.microsoft,
  ]
}

# ── Cognito-hosted UI domain (for the managed sign-in page) ───────────────

resource "aws_cognito_user_pool_domain" "main" {
  # Uses the Cognito-provided subdomain; swap for a custom domain later
  domain       = "${var.project}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ── Identity Pool ─────────────────────────────────────────────────────────

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project} ${var.environment}"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }
}

# ── IAM role for authenticated Identity Pool users ─────────────────────────
# The DynamoDB module attaches an inline policy to this role so that
# users can only read/write rows keyed to their own Cognito identity.

data "aws_iam_policy_document" "identity_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.main.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "authenticated" {
  name               = "${var.project}-${var.environment}-cognito-auth"
  assume_role_policy = data.aws_iam_policy_document.identity_assume.json

  tags = {
    Name = "${var.project}-${var.environment}-cognito-auth"
  }
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}

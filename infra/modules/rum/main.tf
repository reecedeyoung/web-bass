# ── Cognito Identity Pool (unauthenticated — vends temp creds to the RUM SDK) ─

resource "aws_cognito_identity_pool" "rum" {
  identity_pool_name               = "${var.project} ${var.environment} rum"
  allow_unauthenticated_identities = true
  allow_classic_flow               = false
}

data "aws_iam_policy_document" "rum_assume" {
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
      values   = [aws_cognito_identity_pool.rum.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["unauthenticated"]
    }
  }
}

resource "aws_iam_role" "rum_unauth" {
  name               = "${var.project}-${var.environment}-rum-unauth"
  assume_role_policy = data.aws_iam_policy_document.rum_assume.json
}

data "aws_iam_policy_document" "rum_put_events" {
  statement {
    effect    = "Allow"
    actions   = ["rum:PutRumEvents"]
    resources = [aws_rum_app_monitor.main.arn]
  }
}

resource "aws_iam_role_policy" "rum_unauth" {
  name   = "rum-put-events"
  role   = aws_iam_role.rum_unauth.id
  policy = data.aws_iam_policy_document.rum_put_events.json
}

resource "aws_cognito_identity_pool_roles_attachment" "rum" {
  identity_pool_id = aws_cognito_identity_pool.rum.id

  roles = {
    unauthenticated = aws_iam_role.rum_unauth.arn
  }
}

# ── RUM App Monitor ────────────────────────────────────────────────────────────

resource "aws_rum_app_monitor" "main" {
  name   = "${var.project}-${var.environment}"
  domain = var.domain

  app_monitor_configuration {
    allow_cookies       = true
    enable_xray         = false
    session_sample_rate = var.session_sample_rate
    telemetries         = ["errors", "http", "performance"]

    identity_pool_id = aws_cognito_identity_pool.rum.id
    guest_role_arn   = aws_iam_role.rum_unauth.arn
  }

  custom_events {
    status = "ENABLED"
  }
}

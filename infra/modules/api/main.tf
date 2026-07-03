locals {
  fn_name = "${var.project}-${var.environment}-api"
}

# ── Lambda execution role ──────────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${local.fn_name}-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

data "aws_iam_policy_document" "lambda_exec" {
  statement {
    sid       = "Logs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.fn.arn}:*"]
  }
  statement {
    sid    = "DynamoDB"
    effect = "Allow"
    actions = [
      "dynamodb:Query",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [
      var.presets_table_arn,
      var.keyboard_mappings_table_arn,
    ]
  }
  statement {
    sid       = "CognitoIdentityGetId"
    effect    = "Allow"
    actions   = ["cognito-identity:GetId"]
    resources = ["arn:aws:cognito-identity:${var.aws_region}:${var.account_id}:identitypool/${var.cognito_identity_pool_id}"]
  }
}

resource "aws_iam_role_policy" "lambda_exec" {
  name   = "exec"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_exec.json
}

# ── CloudWatch log group ───────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "fn" {
  name              = "/aws/lambda/${local.fn_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${local.fn_name}"
  retention_in_days = 14
}

# ── Lambda function ────────────────────────────────────────────────────────

resource "aws_lambda_function" "api" {
  function_name    = local.fn_name
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      PRESETS_TABLE           = var.presets_table_name
      KEYBOARD_MAPPINGS_TABLE = var.keyboard_mappings_table_name
      IDENTITY_POOL_ID        = var.cognito_identity_pool_id
      USER_POOL_ID            = var.cognito_user_pool_id
      ACCOUNT_ID              = var.account_id
    }
  }

  depends_on = [aws_cloudwatch_log_group.fn]

  tags = {
    Name = local.fn_name
  }
}

# ── HTTP API (v2) ──────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "api" {
  name          = local.fn_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["Authorization", "Content-Type"]
    allow_methods = ["GET", "PUT", "DELETE", "OPTIONS"]
    allow_origins = var.cors_allow_origins
    max_age       = 3600
  }
}

# ── JWT authorizer — validates Cognito User Pool tokens ───────────────────

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito"

  jwt_configuration {
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
    audience = [var.cognito_user_pool_client_id]
  }
}

# ── Lambda integration ─────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# ── Routes (all protected by Cognito JWT authorizer) ──────────────────────

locals {
  routes = toset([
    "GET /api/presets",
    "PUT /api/presets/{presetId}",
    "DELETE /api/presets/{presetId}",
    "GET /api/mappings",
    "PUT /api/mappings/{mappingId}",
  ])
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes

  api_id             = aws_apigatewayv2_api.api.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# ── Stage ─────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
    detailed_metrics_enabled = false
    logging_level            = "OFF"
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      sourceIp       = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }
}

# ── Allow API Gateway to invoke Lambda ────────────────────────────────────

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

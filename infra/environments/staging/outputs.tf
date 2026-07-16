# ── Deployment targets ─────────────────────────────────────────────────────
# These values are consumed by CI/CD to deploy the built React app.

output "s3_bucket_name" {
  description = "Upload build artefacts here: aws s3 sync dist/ s3://<bucket>"
  value       = module.cloudfront.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "Invalidate after deploy: aws cloudfront create-invalidation --distribution-id <id> --paths '/*'"
  value       = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_url" {
  value = "https://${var.domain_name}"
}

# ── App config (use in VITE_ env vars or a runtime config file) ───────────

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "cognito_identity_pool_id" {
  value = module.cognito.identity_pool_id
}

output "cognito_hosted_ui_domain" {
  value = "https://${module.cognito.user_pool_domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "dynamodb_presets_table" {
  value = module.dynamodb.presets_table_name
}

output "dynamodb_keyboard_mappings_table" {
  value = module.dynamodb.keyboard_mappings_table_name
}

# ── CI/CD ──────────────────────────────────────────────────────────────────

output "deploy_role_arn" {
  description = "Set as AWS_ROLE_ARN secret in the GitHub 'staging' environment"
  value       = module.cicd_role.role_arn
}

output "api_gateway_url" {
  description = "API Gateway invoke URL (set VITE_DEV_API_URL in .env.local to this for local dev)"
  value       = module.api.api_gateway_url
}

output "lambda_function_name" {
  description = "Set as LAMBDA_FUNCTION_NAME secret in the GitHub staging environment"
  value       = module.api.lambda_function_name
}

output "rum_app_monitor_id" {
  description = "Set as VITE_RUM_APP_MONITOR_ID in the frontend build"
  value       = module.rum.app_monitor_id
}

output "rum_identity_pool_id" {
  description = "Set as VITE_RUM_IDENTITY_POOL_ID in the frontend build"
  value       = module.rum.identity_pool_id
}

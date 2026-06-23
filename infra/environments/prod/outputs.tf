# ── Deployment targets ─────────────────────────────────────────────────────

output "s3_bucket_name" {
  description = "Upload build artefacts here: aws s3 sync dist/ s3://<bucket> --delete"
  value       = module.cloudfront.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "Invalidate after deploy: aws cloudfront create-invalidation --distribution-id <id> --paths '/*'"
  value       = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_url" {
  value = "https://${var.domain_name}"
}

# ── App config ─────────────────────────────────────────────────────────────

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
  description = "Set as AWS_ROLE_ARN secret in the GitHub 'prod' environment"
  value       = module.cicd_role.role_arn
}

# ── Future API ─────────────────────────────────────────────────────────────

output "api_elastic_ip" {
  description = "Reserved for the future API server — add an A record here when the ECS service is live"
  value       = module.networking.elastic_ip_address
}

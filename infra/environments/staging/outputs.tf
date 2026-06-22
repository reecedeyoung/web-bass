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

# ── DNS handoff ────────────────────────────────────────────────────────────
# Add these as NS records under staging.k-strong-bass.com in the prod-bass
# Route53 zone to delegate the subdomain to this account.

output "name_servers" {
  description = "Add as NS delegation records in the prod-bass k-strong-bass.com zone"
  value       = module.dns.name_servers
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

# ── Future API ─────────────────────────────────────────────────────────────

output "api_elastic_ip" {
  description = "Reserved for the future API server"
  value       = module.networking.elastic_ip_address
}

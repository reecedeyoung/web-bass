output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  value = aws_cognito_user_pool.main.endpoint
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "user_pool_domain" {
  description = "Cognito hosted UI base URL: https://{domain}.auth.{region}.amazoncognito.com"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.main.id
}

output "authenticated_role_arn" {
  value = aws_iam_role.authenticated.arn
}

output "authenticated_role_id" {
  description = "Role ID (name) — used by the DynamoDB module to attach an inline policy"
  value       = aws_iam_role.authenticated.id
}

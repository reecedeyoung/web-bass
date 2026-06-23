output "role_arn" {
  description = "Set as AWS_ROLE_ARN secret in GitHub repository / environment settings"
  value       = aws_iam_role.deploy.arn
}

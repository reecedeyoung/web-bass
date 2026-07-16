output "app_monitor_id" {
  value = aws_rum_app_monitor.main.id
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.rum.id
}

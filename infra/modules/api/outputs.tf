output "api_gateway_url" {
  description = "HTTP API invoke URL — passed to the CloudFront module as api_gateway_url"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_function_name" {
  description = "Lambda function name — used by CI/CD to update function code"
  value       = aws_lambda_function.api.function_name
}

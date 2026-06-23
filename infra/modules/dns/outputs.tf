output "acm_certificate_arn" {
  description = "Validated ACM certificate ARN — pass to the CloudFront module"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

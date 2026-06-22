output "zone_id" {
  value = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "NS records — point your registrar (prod) or parent zone delegation (staging) here"
  value       = aws_route53_zone.main.name_servers
}

output "acm_certificate_arn" {
  description = "Validated ACM certificate ARN — pass to the CloudFront module"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

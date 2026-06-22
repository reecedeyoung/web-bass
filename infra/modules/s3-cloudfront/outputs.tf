output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name — used for Route53 alias records"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID — used for Route53 alias records"
  value       = aws_cloudfront_distribution.website.hosted_zone_id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.website.bucket
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.website.arn
}

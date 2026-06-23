variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "s3_bucket_arn" {
  type        = string
  description = "ARN of the S3 website bucket the role may sync to"
}

variable "cloudfront_distribution_id" {
  type        = string
  description = "CloudFront distribution ID the role may invalidate"
}

variable "github_subject_claim" {
  type        = string
  description = <<-EOT
    GitHub Actions OIDC sub claim to allow — scopes the role to a specific
    repo and GitHub environment. Example:
      repo:myorg/myrepo:environment:prod
    Use a trailing wildcard only for branches:
      repo:myorg/myrepo:ref:refs/heads/main
  EOT
}

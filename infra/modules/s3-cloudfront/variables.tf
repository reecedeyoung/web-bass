variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_aliases" {
  description = "CloudFront alternate domain names (must match the ACM cert)"
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "Validated ACM certificate ARN — must be in us-east-1"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe
}

variable "api_gateway_url" {
  description = "API Gateway invoke URL. When set, /api/* requests are routed to it instead of S3."
  type        = string
  default     = ""
}

variable "project" {
  type    = string
  default = "k-strong-bass"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "web-bass.com"
}

variable "callback_urls" {
  type = list(string)
  default = [
    "https://web-bass.com",
    "https://www.web-bass.com",
  ]
}

variable "logout_urls" {
  type = list(string)
  default = [
    "https://web-bass.com",
    "https://www.web-bass.com",
  ]
}

variable "github_subject_claim" {
  type        = string
  description = "OIDC sub claim — set to repo:ORG/REPO:environment:prod after creating the GitHub environment"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for web-bass.com — Overview page right sidebar"
}

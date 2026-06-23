variable "project" {
  type    = string
  default = "k-strong-bass"
}

variable "environment" {
  type    = string
  default = "staging"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "staging.web-bass.com"
}

variable "callback_urls" {
  type = list(string)
  default = [
    "https://staging.web-bass.com",
    "http://localhost:5173", # Vite dev server
  ]
}

variable "logout_urls" {
  type = list(string)
  default = [
    "https://staging.web-bass.com",
    "http://localhost:5173",
  ]
}

variable "github_subject_claim" {
  type        = string
  description = "OIDC sub claim — set to repo:ORG/REPO:environment:staging after creating the GitHub environment"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for web-bass.com — Overview page right sidebar"
}

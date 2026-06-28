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

# ── Social provider credentials (set in terraform.tfvars when ready) ───────

variable "google_client_id" {
  type      = string
  default   = ""
  sensitive = true
}
variable "google_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}
variable "facebook_app_id" {
  type      = string
  default   = ""
  sensitive = true
}
variable "facebook_app_secret" {
  type      = string
  default   = ""
  sensitive = true
}
variable "apple_service_id" {
  type      = string
  default   = ""
  sensitive = true
}
variable "apple_team_id" {
  type    = string
  default = ""
}
variable "apple_key_id" {
  type    = string
  default = ""
}
variable "apple_private_key" {
  type      = string
  default   = ""
  sensitive = true
}
variable "microsoft_client_id" {
  type      = string
  default   = ""
  sensitive = true
}
variable "microsoft_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}

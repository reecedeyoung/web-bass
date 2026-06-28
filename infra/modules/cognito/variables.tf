variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "callback_urls" {
  description = "Allowed OAuth callback URLs (must include https in prod)"
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed OAuth logout URLs"
  type        = list(string)
}

# ── Social identity provider credentials (optional) ───────────────────────
# Leave as empty string to disable a provider. Set via terraform.tfvars or
# a secrets manager. Enabling a provider requires a terraform apply.

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

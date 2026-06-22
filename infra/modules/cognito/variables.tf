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

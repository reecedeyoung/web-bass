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
  default = "staging.k-strong-bass.com"
}

variable "callback_urls" {
  type = list(string)
  default = [
    "https://staging.k-strong-bass.com",
    "http://localhost:5173", # Vite dev server
  ]
}

variable "logout_urls" {
  type = list(string)
  default = [
    "https://staging.k-strong-bass.com",
    "http://localhost:5173",
  ]
}

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
  default = "k-strong-bass.com"
}

variable "callback_urls" {
  type = list(string)
  default = [
    "https://k-strong-bass.com",
    "https://www.k-strong-bass.com",
  ]
}

variable "logout_urls" {
  type = list(string)
  default = [
    "https://k-strong-bass.com",
    "https://www.k-strong-bass.com",
  ]
}

variable "project"     { type = string }
variable "environment" { type = string }

variable "domain" {
  description = "Domain the RUM app monitor will track (e.g. web-bass.com)"
  type        = string
}

variable "session_sample_rate" {
  description = "Fraction of sessions to sample (0.0–1.0)"
  type        = number
  default     = 1.0
}

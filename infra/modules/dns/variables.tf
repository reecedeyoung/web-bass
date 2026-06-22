variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_name" {
  description = "The Route53 zone name (k-strong-bass.com or staging.k-strong-bass.com)"
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional names on the ACM cert (e.g. www.k-strong-bass.com for prod)"
  type        = list(string)
  default     = []
}

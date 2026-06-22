variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "authenticated_role_id" {
  description = "ID (name) of the Cognito authenticated IAM role — policy is attached here"
  type        = string
}

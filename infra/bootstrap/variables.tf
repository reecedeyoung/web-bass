variable "project" {
  description = "Project slug used in all resource names"
  type        = string
  default     = "k-strong-bass"
}

variable "environment" {
  description = "Environment: staging or prod"
  type        = string

  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "environment must be staging or prod"
  }
}

variable "aws_profile" {
  description = "AWS CLI named profile (dev-bass or prod-bass)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for the state bucket"
  type        = string
  default     = "us-east-1"
}

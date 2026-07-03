variable "project"     { type = string }
variable "environment" { type = string }

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "account_id" {
  description = "AWS account ID — used by Lambda to call Cognito Identity GetId during migration"
  type        = string
}

variable "cognito_user_pool_id"        { type = string }
variable "cognito_user_pool_client_id" { type = string }
variable "cognito_identity_pool_id"    { type = string }

variable "presets_table_name"           { type = string }
variable "presets_table_arn"            { type = string }
variable "keyboard_mappings_table_name" { type = string }
variable "keyboard_mappings_table_arn"  { type = string }

variable "cors_allow_origins" {
  type    = list(string)
  default = []
}

variable "lambda_zip_path" {
  description = "Local path to the built api.zip — must be built before terraform apply"
  type        = string
}

variable "throttling_burst_limit" {
  type    = number
  default = 100
}

variable "throttling_rate_limit" {
  type    = number
  default = 20
}

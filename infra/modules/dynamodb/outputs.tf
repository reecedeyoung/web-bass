output "presets_table_name" {
  value = aws_dynamodb_table.presets.name
}

output "presets_table_arn" {
  value = aws_dynamodb_table.presets.arn
}

output "keyboard_mappings_table_name" {
  value = aws_dynamodb_table.keyboard_mappings.name
}

output "keyboard_mappings_table_arn" {
  value = aws_dynamodb_table.keyboard_mappings.arn
}

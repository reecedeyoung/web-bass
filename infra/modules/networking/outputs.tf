output "elastic_ip_address" {
  description = "The public Elastic IP address reserved for the API server"
  value       = aws_eip.api.public_ip
}

output "elastic_ip_allocation_id" {
  description = "Allocation ID — needed when associating with an EC2 instance or NLB"
  value       = aws_eip.api.allocation_id
}

output "vpc_id" {
  description = "The simulated VPC resource ID"
  value       = null_resource.vpc.id
}

output "public_subnet_ids" {
  description = "List of simulated public subnet IDs"
  value       = null_resource.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "List of simulated private subnet IDs"
  value       = null_resource.private_subnets[*].id
}

output "security_group_id" {
  description = "The simulated default security group ID"
  value       = null_resource.default_security_group.id
}

output "internet_gateway_id" {
  description = "The simulated internet gateway ID"
  value       = null_resource.internet_gateway.id
}

output "nat_gateway_id" {
  description = "The simulated NAT gateway ID"
  value       = null_resource.nat_gateway.id
}

# =============================================================================
# Root Outputs: Aggregated from all child modules
# =============================================================================

# --- Networking outputs ---
output "vpc_id" {
  description = "The simulated VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "List of simulated public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of simulated private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "security_group_id" {
  description = "The simulated default security group ID"
  value       = module.networking.security_group_id
}

# --- Compute outputs ---
output "instance_ids" {
  description = "List of simulated EC2 instance IDs"
  value       = module.compute.instance_ids
}

output "ssh_public_key" {
  description = "The generated SSH public key (simulated key pair)"
  value       = module.compute.ssh_public_key
  sensitive   = true
}

# --- Storage outputs ---
output "bucket_name" {
  description = "The simulated S3 bucket name"
  value       = module.storage.bucket_name
}

output "bucket_arn" {
  description = "The simulated S3 bucket ARN"
  value       = module.storage.bucket_arn
}

# --- Database outputs ---
output "db_endpoint" {
  description = "The simulated RDS endpoint"
  value       = module.database.db_endpoint
}

output "db_password" {
  description = "The generated database password"
  value       = module.database.db_password
  sensitive   = true
}

# --- Lambda outputs ---
output "lambda_function_name" {
  description = "The simulated Lambda function name"
  value       = module.lambda.function_name
}

output "lambda_log_group" {
  description = "The simulated CloudWatch log group name"
  value       = module.lambda.log_group_name
}

# --- Load Balancer outputs ---
output "alb_dns_name" {
  description = "The simulated ALB DNS name"
  value       = module.loadbalancer.alb_dns_name
}

output "alb_arn" {
  description = "The simulated ALB ARN"
  value       = module.loadbalancer.alb_arn
}

output "target_group_id" {
  description = "The simulated target group resource ID"
  value       = module.loadbalancer.target_group_id
}

output "db_subnet_group_id" {
  description = "The simulated DB subnet group ID"
  value       = module.database.db_subnet_group_id
}

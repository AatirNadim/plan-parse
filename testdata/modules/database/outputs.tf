output "db_endpoint" {
  description = "The simulated RDS endpoint"
  value       = "${var.project}-${var.environment}-db-${random_id.db_identifier.hex}.cluster-xxxxx.${var.environment}.rds.amazonaws.com:5432"
}

output "db_instance_id" {
  description = "The simulated RDS instance resource ID"
  value       = null_resource.rds_instance.id
}

output "db_password" {
  description = "The generated database master password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "db_subnet_group_id" {
  description = "The simulated DB subnet group ID"
  value       = null_resource.db_subnet_group.id
}

output "db_parameter_group_id" {
  description = "The simulated DB parameter group ID"
  value       = null_resource.db_parameter_group.id
}

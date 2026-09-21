# =============================================================================
# Database Module
# Mimics: RDS Instance, DB Subnet Group, DB Parameter Group, Random Password,
#          Security Group Rule for DB access
# =============================================================================

# Mimics: random password for aws_db_instance master password
resource "random_password" "db_password" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}|:,.<>?"

  keepers = {
    project     = var.project
    environment = var.environment
  }
}

# Mimics: aws_db_subnet_group (depends on subnet_ids from networking)
resource "null_resource" "db_subnet_group" {
  triggers = {
    name          = "${var.project}-${var.environment}-db-subnet-group"
    subnet_ids    = join(",", var.subnet_ids)
    resource_type = "aws_db_subnet_group"
    description   = "Database subnet group for ${var.project} ${var.environment}"
    tags          = jsonencode(var.tags)
  }
}

# Mimics: aws_db_parameter_group
resource "null_resource" "db_parameter_group" {
  triggers = {
    name          = "${var.project}-${var.environment}-db-params"
    family        = "${var.db_engine}${regex("^\\d+", var.db_engine_version)}"
    resource_type = "aws_db_parameter_group"
    # Simulated parameters
    param_log_connections    = "1"
    param_log_disconnections = "1"
    param_log_duration       = "1"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Mimics: aws_security_group_rule (allow DB port from VPC)
resource "null_resource" "db_sg_rule" {
  triggers = {
    security_group_id = var.security_group_id
    type              = "ingress"
    from_port         = "5432"
    to_port           = "5432"
    protocol          = "tcp"
    cidr_blocks       = "10.0.0.0/16"
    resource_type     = "aws_security_group_rule"
    description       = "PostgreSQL access from VPC"
  }
}

# Mimics: aws_db_instance (depends on subnet group, parameter group, SG rule, password)
resource "random_id" "db_identifier" {
  byte_length = 4

  keepers = {
    project     = var.project
    environment = var.environment
  }
}

resource "null_resource" "rds_instance" {
  triggers = {
    identifier           = "${var.project}-${var.environment}-db-${random_id.db_identifier.hex}"
    engine               = var.db_engine
    engine_version       = var.db_engine_version
    instance_class       = var.db_instance_class
    allocated_storage    = "50"
    max_allocated_storage = "200"
    db_subnet_group_name = null_resource.db_subnet_group.id
    parameter_group_name = null_resource.db_parameter_group.id
    vpc_security_group_id = var.security_group_id
    vpc_id               = var.vpc_id
    multi_az             = "true"
    storage_encrypted    = "true"
    skip_final_snapshot  = "true"
    resource_type        = "aws_db_instance"
    password_set         = random_password.db_password.id
    sg_rule_id           = null_resource.db_sg_rule.id
  }

  depends_on = [
    null_resource.db_subnet_group,
    null_resource.db_parameter_group,
    null_resource.db_sg_rule,
  ]
}

# Write a simulated connection string to a local file
# Mimics: storing DB connection info in SSM Parameter Store
resource "local_file" "db_connection_info" {
  filename = "${path.module}/generated/${var.project}-${var.environment}-db-connection.json"
  content = jsonencode({
    host     = "${var.project}-${var.environment}-db-${random_id.db_identifier.hex}.cluster-xxxxx.${var.environment}.rds.amazonaws.com"
    port     = 5432
    database = var.project
    engine   = var.db_engine
    note     = "Simulated RDS connection info for plan visualization"
  })
}

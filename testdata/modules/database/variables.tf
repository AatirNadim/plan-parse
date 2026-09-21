variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_engine" {
  description = "Database engine (e.g. postgres, mysql)"
  type        = string
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string

  validation {
    condition     = can(regex("^\\d+", var.db_engine_version))
    error_message = "db_engine_version must start with a digit (e.g., '15.4')."
  }
}

variable "subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group (from networking module)"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for DB access (from networking module)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID (from networking module)"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

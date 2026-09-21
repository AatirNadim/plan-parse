variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "instance_count" {
  description = "Number of EC2 instances to create"
  type        = number
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs to place instances in (from networking module)"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID to attach to instances (from networking module)"
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

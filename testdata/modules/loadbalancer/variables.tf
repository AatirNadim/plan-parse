variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "subnet_ids" {
  description = "List of public subnet IDs for the ALB (from networking module)"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID (from networking module)"
  type        = string
}

variable "instance_ids" {
  description = "List of EC2 instance IDs to register as targets (from compute module)"
  type        = list(string)
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

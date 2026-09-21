variable "project" {
  description = "Project name used as a prefix for all resources"
  type        = string
  default     = "tf-visualize"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "Simulated AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the simulated VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of simulated availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "instance_count" {
  description = "Number of simulated EC2 instances"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "Simulated EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "db_instance_class" {
  description = "Simulated RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_engine" {
  description = "Simulated database engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Simulated database engine version"
  type        = string
  default     = "15.4"
}

variable "lambda_runtime" {
  description = "Simulated Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "lambda_memory" {
  description = "Simulated Lambda memory in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Simulated Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    ManagedBy = "terraform"
    Tool      = "tf-visualize"
  }
}

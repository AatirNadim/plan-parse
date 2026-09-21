variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime (e.g. python3.11, nodejs18.x)"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory allocation in MB"
  type        = number
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "bucket_name" {
  description = "S3 bucket name for Lambda config (from storage module)"
  type        = string
}

variable "bucket_arn" {
  description = "S3 bucket ARN for IAM policy (from storage module)"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

output "bucket_name" {
  description = "The simulated S3 bucket name"
  value       = random_pet.bucket_name.id
}

output "bucket_arn" {
  description = "The simulated S3 bucket ARN"
  value       = "arn:aws:s3:::${random_pet.bucket_name.id}"
}

output "bucket_id" {
  description = "The simulated S3 bucket resource ID"
  value       = null_resource.s3_bucket.id
}

output "iam_role_id" {
  description = "The simulated IAM role ID for S3 access"
  value       = null_resource.s3_access_role.id
}

output "iam_policy_id" {
  description = "The simulated IAM policy ID"
  value       = null_resource.s3_policy.id
}

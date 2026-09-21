# =============================================================================
# Storage Module
# Mimics: S3 Bucket, Bucket Versioning, Bucket Policy, IAM Role, IAM Policy,
#          IAM Role Policy Attachment
# =============================================================================

# Mimics: aws_s3_bucket
resource "random_pet" "bucket_name" {
  prefix    = "${var.project}-${var.environment}"
  separator = "-"
  length    = 2

  keepers = {
    project     = var.project
    environment = var.environment
  }
}

resource "null_resource" "s3_bucket" {
  triggers = {
    bucket        = random_pet.bucket_name.id
    region        = var.region
    acl           = "private"
    name          = random_pet.bucket_name.id
    resource_type = "aws_s3_bucket"
    force_destroy = "true"
    tags          = jsonencode(var.tags)
  }

  # Lifecycle: prevent_destroy = false (since we want to be able to destroy)
  lifecycle {
    prevent_destroy = false
  }
}

# Mimics: aws_s3_bucket_versioning (depends on bucket)
resource "null_resource" "bucket_versioning" {
  triggers = {
    bucket        = null_resource.s3_bucket.id
    status        = "Enabled"
    resource_type = "aws_s3_bucket_versioning"
  }
}

# Mimics: aws_s3_bucket_server_side_encryption_configuration
resource "null_resource" "bucket_encryption" {
  triggers = {
    bucket            = null_resource.s3_bucket.id
    sse_algorithm     = "aws:kms"
    bucket_key_enabled = "true"
    resource_type     = "aws_s3_bucket_server_side_encryption_configuration"
  }
}

# Mimics: aws_iam_role (for S3 access)
resource "random_id" "iam_role_suffix" {
  byte_length = 4

  keepers = {
    bucket = null_resource.s3_bucket.id
  }
}

resource "null_resource" "s3_access_role" {
  triggers = {
    role_name         = "${var.project}-${var.environment}-s3-access-${random_id.iam_role_suffix.hex}"
    assume_role_policy = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }]
    })
    resource_type = "aws_iam_role"
  }
}

# Mimics: aws_iam_policy (S3 read/write policy)
resource "null_resource" "s3_policy" {
  triggers = {
    policy_name = "${var.project}-${var.environment}-s3-rw-policy"
    policy_document = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Resource = ["arn:aws:s3:::${random_pet.bucket_name.id}", "arn:aws:s3:::${random_pet.bucket_name.id}/*"]
      }]
    })
    resource_type = "aws_iam_policy"
  }
}

# Mimics: aws_iam_role_policy_attachment (depends on role + policy)
resource "null_resource" "s3_policy_attachment" {
  triggers = {
    role_id       = null_resource.s3_access_role.id
    policy_id     = null_resource.s3_policy.id
    resource_type = "aws_iam_role_policy_attachment"
  }
}

# Write a simulated bucket policy document to local file
# Mimics: aws_s3_bucket_policy
resource "local_file" "bucket_policy" {
  filename = "${path.module}/generated/${var.project}-${var.environment}-bucket-policy.json"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSSLRequestsOnly"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = ["arn:aws:s3:::${random_pet.bucket_name.id}", "arn:aws:s3:::${random_pet.bucket_name.id}/*"]
      Condition = {
        Bool = { "aws:SecureTransport" = "false" }
      }
    }]
  })
}

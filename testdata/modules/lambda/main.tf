# =============================================================================
# Lambda Module
# Mimics: Lambda Function, IAM Role, IAM Policy, CloudWatch Log Group,
#          Lambda Permission, Event Source Mapping
# =============================================================================

# Mimics: aws_iam_role (Lambda execution role)
resource "null_resource" "lambda_execution_role" {
  triggers = {
    role_name = "${var.project}-${var.environment}-lambda-exec"
    assume_role_policy = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }]
    })
    resource_type = "aws_iam_role"
    tags          = jsonencode(var.tags)
  }
}

# Mimics: aws_iam_policy (Lambda permissions to S3 + CloudWatch)
resource "null_resource" "lambda_policy" {
  triggers = {
    policy_name = "${var.project}-${var.environment}-lambda-policy"
    policy_document = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect   = "Allow"
          Action   = ["s3:GetObject", "s3:PutObject"]
          Resource = ["${var.bucket_arn}/*"]
        },
        {
          Effect   = "Allow"
          Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
          Resource = ["arn:aws:logs:*:*:*"]
        }
      ]
    })
    resource_type = "aws_iam_policy"
  }
}

# Mimics: aws_iam_role_policy_attachment (attach policy to role)
resource "null_resource" "lambda_policy_attachment" {
  triggers = {
    role_id       = null_resource.lambda_execution_role.id
    policy_id     = null_resource.lambda_policy.id
    resource_type = "aws_iam_role_policy_attachment"
  }
}

# Mimics: aws_cloudwatch_log_group (created before Lambda so logs have a destination)
resource "random_string" "log_group_suffix" {
  length  = 6
  special = false
  upper   = false

  keepers = {
    project     = var.project
    environment = var.environment
  }
}

resource "null_resource" "cloudwatch_log_group" {
  triggers = {
    name              = "/aws/lambda/${var.project}-${var.environment}-processor"
    retention_in_days = "14"
    resource_type     = "aws_cloudwatch_log_group"
    log_group_suffix  = random_string.log_group_suffix.result
  }
}

# Mimics: aws_lambda_function (depends on role, policy attachment, log group, bucket)
resource "random_id" "lambda_version" {
  byte_length = 8

  keepers = {
    runtime     = var.runtime
    memory_size = var.memory_size
    timeout     = var.timeout
    bucket_name = var.bucket_name
  }
}

resource "null_resource" "lambda_function" {
  triggers = {
    function_name    = "${var.project}-${var.environment}-processor"
    runtime          = var.runtime
    handler          = "index.handler"
    memory_size      = tostring(var.memory_size)
    timeout          = tostring(var.timeout)
    role_id          = null_resource.lambda_execution_role.id
    source_code_hash = random_id.lambda_version.hex
    resource_type    = "aws_lambda_function"
    log_group_id     = null_resource.cloudwatch_log_group.id

    # Cross-module dependency: references storage bucket
    s3_bucket = var.bucket_name

    environment_variables = jsonencode({
      BUCKET_NAME = var.bucket_name
      ENVIRONMENT = var.environment
      LOG_LEVEL   = "INFO"
    })
  }

  depends_on = [
    null_resource.lambda_policy_attachment,
    null_resource.cloudwatch_log_group,
  ]
}

# Mimics: aws_lambda_permission (allow API Gateway to invoke)
resource "null_resource" "lambda_permission_apigw" {
  triggers = {
    statement_id  = "AllowAPIGatewayInvoke"
    action        = "lambda:InvokeFunction"
    function_id   = null_resource.lambda_function.id
    principal     = "apigateway.amazonaws.com"
    resource_type = "aws_lambda_permission"
  }
}

# Write a simulated Lambda deployment package manifest
resource "local_file" "lambda_manifest" {
  filename = "${path.module}/generated/${var.project}-${var.environment}-lambda-manifest.json"
  content = jsonencode({
    function_name = "${var.project}-${var.environment}-processor"
    runtime       = var.runtime
    handler       = "index.handler"
    memory_size   = var.memory_size
    timeout       = var.timeout
    environment = {
      BUCKET_NAME = var.bucket_name
      ENVIRONMENT = var.environment
    }
    note = "Simulated Lambda manifest for plan visualization"
  })
}

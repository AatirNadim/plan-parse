output "function_name" {
  description = "The simulated Lambda function name"
  value       = "${var.project}-${var.environment}-processor"
}

output "function_id" {
  description = "The simulated Lambda function resource ID"
  value       = null_resource.lambda_function.id
}

output "log_group_name" {
  description = "The simulated CloudWatch log group name"
  value       = "/aws/lambda/${var.project}-${var.environment}-processor"
}

output "execution_role_id" {
  description = "The simulated Lambda execution role ID"
  value       = null_resource.lambda_execution_role.id
}

output "lambda_permission_id" {
  description = "The simulated Lambda permission ID"
  value       = null_resource.lambda_permission_apigw.id
}

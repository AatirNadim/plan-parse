output "alb_dns_name" {
  description = "The simulated ALB DNS name"
  value       = "${var.project}-${var.environment}-alb-${random_id.alb_suffix.hex}.${var.environment}.elb.amazonaws.com"
}

output "alb_arn" {
  description = "The simulated ALB ARN"
  value       = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${var.project}-${var.environment}-alb/${random_id.alb_suffix.hex}"
}

output "alb_id" {
  description = "The simulated ALB resource ID"
  value       = null_resource.alb.id
}

output "target_group_id" {
  description = "The simulated target group resource ID"
  value       = null_resource.target_group.id
}

output "listener_http_id" {
  description = "The simulated HTTP listener resource ID"
  value       = null_resource.listener_http.id
}

output "listener_https_id" {
  description = "The simulated HTTPS listener resource ID"
  value       = null_resource.listener_https.id
}

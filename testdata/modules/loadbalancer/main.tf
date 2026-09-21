# =============================================================================
# Load Balancer Module
# Mimics: ALB, Target Group, Listener, Listener Rule, Target Group Attachment
# =============================================================================

# Mimics: aws_lb (Application Load Balancer)
resource "random_id" "alb_suffix" {
  byte_length = 4

  keepers = {
    project     = var.project
    environment = var.environment
  }
}

resource "null_resource" "alb" {
  triggers = {
    name               = "${var.project}-${var.environment}-alb"
    internal           = "false"
    load_balancer_type = "application"
    subnets            = join(",", var.subnet_ids)
    vpc_id             = var.vpc_id
    dns_name           = "${var.project}-${var.environment}-alb-${random_id.alb_suffix.hex}.${var.environment}.elb.amazonaws.com"
    resource_type      = "aws_lb"
    arn                = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${var.project}-${var.environment}-alb/${random_id.alb_suffix.hex}"
    tags               = jsonencode(var.tags)
  }
}

# Mimics: aws_lb_target_group (depends on VPC)
resource "random_integer" "health_check_interval" {
  min = 15
  max = 60

  keepers = {
    project     = var.project
    environment = var.environment
  }
}

resource "null_resource" "target_group" {
  triggers = {
    name                  = "${var.project}-${var.environment}-tg"
    port                  = "8080"
    protocol              = "HTTP"
    vpc_id                = var.vpc_id
    target_type           = "instance"
    health_check_path     = "/health"
    health_check_interval = tostring(random_integer.health_check_interval.result)
    health_check_matcher  = "200-299"
    resource_type         = "aws_lb_target_group"
  }

  # Lifecycle: create_before_destroy for zero-downtime deployments
  lifecycle {
    create_before_destroy = true
  }
}

# Mimics: aws_lb_target_group_attachment (one per instance, uses for_each)
resource "null_resource" "target_group_attachments" {
  for_each = { for i, id in var.instance_ids : tostring(i) => id }

  triggers = {
    target_group_id = null_resource.target_group.id
    target_id       = each.value
    port            = "8080"
    resource_type   = "aws_lb_target_group_attachment"
  }
}

# Mimics: aws_lb_listener (HTTP, depends on ALB + target group)
resource "null_resource" "listener_http" {
  triggers = {
    load_balancer_id   = null_resource.alb.id
    port               = "80"
    protocol           = "HTTP"
    default_action_type = "redirect"
    redirect_port       = "443"
    redirect_protocol   = "HTTPS"
    redirect_status     = "HTTP_301"
    resource_type       = "aws_lb_listener"
  }
}

# Mimics: aws_lb_listener (HTTPS, depends on ALB + target group)
# Uses a TLS cert for the HTTPS listener
resource "tls_private_key" "alb_cert_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "alb_cert" {
  private_key_pem = tls_private_key.alb_cert_key.private_key_pem

  subject {
    common_name  = "${var.project}-${var.environment}.example.com"
    organization = var.project
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "null_resource" "listener_https" {
  triggers = {
    load_balancer_id    = null_resource.alb.id
    port                = "443"
    protocol            = "HTTPS"
    ssl_policy          = "ELBSecurityPolicy-TLS13-1-2-2021-06"
    certificate_arn     = "arn:aws:acm:us-east-1:123456789012:certificate/${random_id.alb_suffix.hex}"
    certificate_created = tls_self_signed_cert.alb_cert.id
    default_action_type = "forward"
    target_group_id     = null_resource.target_group.id
    resource_type       = "aws_lb_listener"
  }
}

# Mimics: aws_lb_listener_rule (path-based routing, depends on listener + target group)
resource "null_resource" "listener_rule_api" {
  triggers = {
    listener_id     = null_resource.listener_https.id
    priority        = "100"
    condition_field = "path-pattern"
    condition_value = "/api/*"
    action_type     = "forward"
    target_group_id = null_resource.target_group.id
    resource_type   = "aws_lb_listener_rule"
  }
}

# Mimics: aws_lb_listener_rule (host-header routing)
resource "null_resource" "listener_rule_static" {
  triggers = {
    listener_id     = null_resource.listener_https.id
    priority        = "200"
    condition_field = "path-pattern"
    condition_value = "/static/*"
    action_type     = "fixed-response"
    status_code     = "404"
    content_type    = "text/plain"
    message_body    = "Static content not found"
    resource_type   = "aws_lb_listener_rule"
  }
}

# Write simulated ALB config to local file for reference
resource "local_file" "alb_config" {
  filename = "${path.module}/generated/${var.project}-${var.environment}-alb-config.json"
  content = jsonencode({
    alb_name    = "${var.project}-${var.environment}-alb"
    dns_name    = "${var.project}-${var.environment}-alb-${random_id.alb_suffix.hex}.${var.environment}.elb.amazonaws.com"
    listeners   = ["HTTP:80 -> redirect HTTPS:443", "HTTPS:443 -> forward target-group"]
    target_port = 8080
    targets     = var.instance_ids
    rules       = ["/api/* -> target-group", "/static/* -> 404"]
    note        = "Simulated ALB config for plan visualization"
  })
}

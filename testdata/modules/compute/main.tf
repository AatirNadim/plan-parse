# =============================================================================
# Compute Module
# Mimics: EC2 Instances, Key Pair, Launch Template, Security Group Rules
# =============================================================================

# Mimics: tls_private_key (for aws_key_pair)
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Mimics: aws_key_pair (depends on tls_private_key)
resource "null_resource" "key_pair" {
  triggers = {
    key_name      = "${var.project}-${var.environment}-keypair"
    public_key    = tls_private_key.ssh_key.public_key_openssh
    resource_type = "aws_key_pair"
    tags          = jsonencode(var.tags)
  }
}

# Write the private key to a local file for reference
# Mimics: local provisioner saving SSH key
resource "local_file" "ssh_private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/generated/${var.project}-${var.environment}.pem"
  file_permission = "0600"
}

# Mimics: aws_launch_template (depends on key_pair, security_group)
resource "null_resource" "launch_template" {
  triggers = {
    name              = "${var.project}-${var.environment}-lt"
    image_id          = "ami-0abcdef1234567890"
    instance_type     = var.instance_type
    key_name          = null_resource.key_pair.id
    security_group_id = var.security_group_id
    resource_type     = "aws_launch_template"
    user_data_hash    = base64sha256("#!/bin/bash\necho 'Hello from ${var.project}'")
  }

  # Lifecycle: demonstrate create_before_destroy
  lifecycle {
    create_before_destroy = true
  }
}

# Mimics: aws_instance (multiple via count, depends on launch_template + subnets)
resource "null_resource" "instances" {
  count = var.instance_count

  triggers = {
    launch_template_id = null_resource.launch_template.id
    subnet_id          = var.subnet_ids[count.index % length(var.subnet_ids)]
    instance_type      = var.instance_type
    name               = "${var.project}-${var.environment}-instance-${count.index}"
    resource_type      = "aws_instance"
    vpc_id             = var.vpc_id
    private_ip         = "10.0.${count.index}.10"
  }

  depends_on = [null_resource.launch_template]
}

# Mimics: aws_security_group_rule (ingress SSH, depends on instances existing)
resource "null_resource" "sg_rule_ssh" {
  triggers = {
    security_group_id = var.security_group_id
    type              = "ingress"
    from_port         = "22"
    to_port           = "22"
    protocol          = "tcp"
    cidr_blocks       = "10.0.0.0/16"
    resource_type     = "aws_security_group_rule"
    description       = "SSH access for compute instances"
  }
}

# Mimics: aws_security_group_rule (ingress app port)
resource "null_resource" "sg_rule_app" {
  triggers = {
    security_group_id = var.security_group_id
    type              = "ingress"
    from_port         = "8080"
    to_port           = "8080"
    protocol          = "tcp"
    cidr_blocks       = "0.0.0.0/0"
    resource_type     = "aws_security_group_rule"
    description       = "Application port for compute instances"
  }
}

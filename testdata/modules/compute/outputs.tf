output "instance_ids" {
  description = "List of simulated EC2 instance IDs"
  value       = null_resource.instances[*].id
}

output "ssh_public_key" {
  description = "The generated SSH public key"
  value       = tls_private_key.ssh_key.public_key_openssh
  sensitive   = true
}

output "key_pair_id" {
  description = "The simulated key pair ID"
  value       = null_resource.key_pair.id
}

output "launch_template_id" {
  description = "The simulated launch template ID"
  value       = null_resource.launch_template.id
}

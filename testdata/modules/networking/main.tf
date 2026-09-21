# =============================================================================
# Networking Module
# Mimics: VPC, Subnets (public + private), Internet Gateway, NAT Gateway,
#          Route Tables, Route Table Associations, Security Group
# =============================================================================

# Mimics: aws_vpc
resource "null_resource" "vpc" {
  triggers = {
    cidr_block    = var.vpc_cidr
    name          = "${var.project}-${var.environment}-vpc"
    resource_type = "aws_vpc"
    environment   = var.environment
    tags          = jsonencode(var.tags)
  }
}

# Mimics: aws_internet_gateway (depends on VPC)
resource "null_resource" "internet_gateway" {
  triggers = {
    vpc_id        = null_resource.vpc.id
    name          = "${var.project}-${var.environment}-igw"
    resource_type = "aws_internet_gateway"
  }
}

# Mimics: aws_subnet (public, multiple via count)
resource "null_resource" "public_subnets" {
  count = length(var.availability_zones)

  triggers = {
    vpc_id              = null_resource.vpc.id
    cidr_block          = cidrsubnet(var.vpc_cidr, 8, count.index)
    availability_zone   = var.availability_zones[count.index]
    map_public_ip       = "true"
    name                = "${var.project}-${var.environment}-public-${var.availability_zones[count.index]}"
    resource_type       = "aws_subnet"
    subnet_type         = "public"
  }
}

# Mimics: aws_subnet (private, multiple via count)
resource "null_resource" "private_subnets" {
  count = length(var.availability_zones)

  triggers = {
    vpc_id            = null_resource.vpc.id
    cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
    availability_zone = var.availability_zones[count.index]
    map_public_ip     = "false"
    name              = "${var.project}-${var.environment}-private-${var.availability_zones[count.index]}"
    resource_type     = "aws_subnet"
    subnet_type       = "private"
  }
}

# Mimics: aws_eip (for NAT Gateway)
resource "null_resource" "nat_eip" {
  triggers = {
    domain        = "vpc"
    name          = "${var.project}-${var.environment}-nat-eip"
    resource_type = "aws_eip"
  }
}

# Mimics: aws_nat_gateway (depends on IGW + public subnet + EIP)
resource "null_resource" "nat_gateway" {
  triggers = {
    allocation_id = null_resource.nat_eip.id
    subnet_id     = null_resource.public_subnets[0].id
    igw_id        = null_resource.internet_gateway.id
    name          = "${var.project}-${var.environment}-nat"
    resource_type = "aws_nat_gateway"
  }
}

# Mimics: aws_route_table (public)
resource "null_resource" "public_route_table" {
  triggers = {
    vpc_id        = null_resource.vpc.id
    gateway_id    = null_resource.internet_gateway.id
    name          = "${var.project}-${var.environment}-public-rt"
    resource_type = "aws_route_table"
  }
}

# Mimics: aws_route_table (private)
resource "null_resource" "private_route_table" {
  triggers = {
    vpc_id           = null_resource.vpc.id
    nat_gateway_id   = null_resource.nat_gateway.id
    name             = "${var.project}-${var.environment}-private-rt"
    resource_type    = "aws_route_table"
  }
}

# Mimics: aws_route_table_association (public subnets)
resource "null_resource" "public_rt_associations" {
  count = length(var.availability_zones)

  triggers = {
    subnet_id      = null_resource.public_subnets[count.index].id
    route_table_id = null_resource.public_route_table.id
    resource_type  = "aws_route_table_association"
  }
}

# Mimics: aws_route_table_association (private subnets)
resource "null_resource" "private_rt_associations" {
  count = length(var.availability_zones)

  triggers = {
    subnet_id      = null_resource.private_subnets[count.index].id
    route_table_id = null_resource.private_route_table.id
    resource_type  = "aws_route_table_association"
  }
}

# Mimics: aws_security_group (default SG for the VPC)
# Uses random_id to generate a synthetic SG identifier
resource "random_id" "security_group_suffix" {
  byte_length = 4

  keepers = {
    vpc_id = null_resource.vpc.id
  }
}

resource "null_resource" "default_security_group" {
  triggers = {
    vpc_id        = null_resource.vpc.id
    sg_id         = "sg-${random_id.security_group_suffix.hex}"
    name          = "${var.project}-${var.environment}-default-sg"
    resource_type = "aws_security_group"
    ingress_http  = "0.0.0.0/0:80"
    ingress_https = "0.0.0.0/0:443"
    ingress_ssh   = "10.0.0.0/16:22"
    egress_all    = "0.0.0.0/0:0-65535"
  }

  # Lifecycle: demonstrate ignore_changes pattern
  lifecycle {
    ignore_changes = [triggers["egress_all"]]
  }
}

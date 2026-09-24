# =============================================================================
# Root Module: Wires child modules together, establishing cross-module deps
# =============================================================================

# --- Networking (independent - no deps on other modules) ---
module "networking" {
  source = "./modules/networking"

  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = var.tags
}

# --- Storage (independent - no deps on other modules) ---
module "storage" {
  source = "./modules/storage"

  project     = var.project
  environment = var.environment
  region      = var.region
  tags        = var.tags
}

# --- Compute (depends on networking) ---
module "compute" {
  source = "./modules/compute"

  project           = var.project
  environment       = var.environment
  instance_count    = var.instance_count
  instance_type     = var.instance_type
  subnet_ids        = module.networking.public_subnet_ids
  security_group_id = module.networking.security_group_id
  vpc_id            = module.networking.vpc_id
  tags              = var.tags
}

# --- Database (depends on networking) ---
module "database" {
  source = "./modules/database"

  project           = var.project
  environment       = var.environment
  db_instance_class = var.db_instance_class
  db_engine         = var.db_engine
  db_engine_version = var.db_engine_version
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.security_group_id
  vpc_id            = module.networking.vpc_id
  tags              = var.tags
}

# --- Lambda (depends on storage for bucket config) ---
module "lambda" {
  source = "./modules/lambda"

  project     = var.project
  environment = var.environment
  runtime     = var.lambda_runtime
  memory_size = var.lambda_memory
  timeout     = var.lambda_timeout
  bucket_name = module.storage.bucket_name
  bucket_arn  = module.storage.bucket_arn
  tags        = var.tags
}

# --- Load Balancer (depends on compute + networking) ---
module "loadbalancer" {
  source = "./modules/loadbalancer"

  project      = var.project
  environment  = var.environment
  subnet_ids   = module.networking.public_subnet_ids
  vpc_id       = module.networking.vpc_id
  instance_ids = module.compute.instance_ids
  tags         = var.tags
}

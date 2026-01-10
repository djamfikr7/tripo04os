terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  required_version = ">= 1.0"

  backend "s3" {
    bucket         = "tripo04os-terraform-state"
    key            = "tripo04os-infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table  = "tripo04os-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Tripo04OS"
      Environment  = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_name,
      "--region",
      var.aws_region
    ]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_name,
        "--region",
        var.aws_region
      ]
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project    = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "tripo04os-terraform-state"
  acl    = "private"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "tripo04os-terraform-locks"
  billing_mode  = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = var.common_tags
}

module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  common_tags        = local.common_tags

  availability_zones    = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs

  enable_nat_gateway   = true
  enable_dns_hostnames  = true
  enable_dns_support    = true

  providers = {
    aws = aws
  }
}

module "eks" {
  source = "./modules/eks"

  cluster_name    = var.eks_cluster_name
  cluster_version = var.eks_cluster_version

  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  node_group_config = {
    min_size     = var.eks_node_group_min_size
    max_size     = var.eks_node_group_max_size
    desired_size = var.eks_node_group_desired_size
    instance_types = var.eks_node_instance_types
  }

  cluster_tags    = local.common_tags
  node_group_tags  = local.common_tags

  providers = {
    aws = aws
  }
}

module "database" {
  source = "./modules/database"

  name_prefix     = local.name_prefix

  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  engine            = var.database_engine
  engine_version    = var.database_engine_version
  instance_class    = var.database_instance_class
  allocated_storage = var.database_allocated_storage
  username          = var.database_username

  security_group_ids = [module.eks.cluster_security_group_id]

  tags = local.common_tags

  providers = {
    aws = aws
  }
}

module "storage" {
  source = "./modules/storage"

  name_prefix = local.name_prefix

  buckets = [
    { name = "${local.name_prefix}-app-assets", acl = "private", versioning = true },
    { name = "${local.name_prefix}-user-uploads", acl = "private", versioning = true },
    { name = "${local.name_prefix}-logs", acl = "log-delivery-write", versioning = false },
    { name = "${local.name_prefix}-backups", acl = "private", versioning = false },
  ]

  tags = local.common_tags

  providers = {
    aws = aws
  }
}

module "cdn" {
  source = "./modules/cdn"

  name_prefix = local.name_prefix
  domain_name = var.domain_name

  subdomains = var.domain_subdomains

  s3_buckets = module.storage.bucket_arns
  security_group_ids = [module.eks.cluster_security_group_id]

  enable_ssl = var.enable_domain_ssl

  tags = local.common_tags

  providers = {
    aws = aws
  }
}

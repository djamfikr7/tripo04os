variable "project_name" {
  description = "Name of project"
  type        = string
  default     = "tripo04os"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "eks_cluster_name" {
  description = "Name of EKS cluster"
  type        = string
  default     = "tripo04os-cluster"
}

variable "eks_node_group_min_size" {
  description = "Minimum number of nodes in EKS node group"
  type        = number
  default     = 3
}

variable "eks_node_group_max_size" {
  description = "Maximum number of nodes in EKS node group"
  type        = number
  default     = 10
}

variable "eks_node_group_desired_size" {
  description = "Desired number of nodes in EKS node group"
  type        = number
  default     = 3
}

variable "eks_node_instance_types" {
  description = "Instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "database_engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "database_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "database_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "database_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "database_username" {
  description = "Database master username"
  type        = string
  default     = "tripo04os_admin"
}

variable "enable_domain_ssl" {
  description = "Enable SSL for domain"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "tripo04os.com"
}

variable "domain_subdomains" {
  description = "List of subdomains"
  type        = list(string)
  default     = ["api", "web", "admin"]
}

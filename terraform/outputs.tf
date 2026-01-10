output "vpc_id" {
  description = "ID of VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of VPC"
  value       = module.vpc.vpc_cidr
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "eks_cluster_ca_certificate" {
  description     = "Base64 encoded certificate data required to communicate with cluster"
  value          = module.eks.cluster_ca_certificate
  sensitive       = true
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_instance_endpoint
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = module.database.rds_instance_port
}

output "s3_bucket_names" {
  description = "Names of S3 buckets"
  value       = module.storage.bucket_names
}

output "cloudfront_distribution_id" {
  description = "ID of CloudFront distribution"
  value       = module.cdn.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of CloudFront distribution"
  value       = module.cdn.cloudfront_domain_name
}

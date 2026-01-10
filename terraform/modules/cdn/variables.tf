variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "subdomains" {
  description = "List of subdomains"
  type        = list(string)
  default     = ["api", "web", "admin"]
}

variable "s3_buckets" {
  description = "S3 bucket ARNs for origin"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
  default     = []
}

variable "enable_ssl" {
  description = "Enable SSL"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags for all resources"
  type        = map(string)
  default     = {}
}

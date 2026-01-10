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

variable "engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "username" {
  description = "Database master username"
  type        = string
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags for all resources"
  type        = map(string)
  default     = {}
}

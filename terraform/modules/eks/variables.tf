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

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "cluster_name" {
  description = "Cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
}

variable "node_group_config" {
  description = "Node group configuration"
  type = object({
    min_size     = number
    max_size     = number
    desired_size = number
    instance_types = list(string)
  })
}

variable "cluster_tags" {
  description = "Tags for cluster"
  type        = map(string)
  default     = {}
}

variable "node_group_tags" {
  description = "Tags for node groups"
  type        = map(string)
  default     = {}
}

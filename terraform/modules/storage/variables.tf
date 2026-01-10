variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "buckets" {
  description = "List of bucket configurations"
  type = list(object({
    name     = string
    acl      = string
    versioning = bool
  }))
}

variable "tags" {
  description = "Tags for all resources"
  type        = map(string)
  default     = {}
}

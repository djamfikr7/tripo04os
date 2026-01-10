resource "aws_s3_bucket" "this" {
  count  = length(var.buckets)
  bucket = "${var.name_prefix}-${var.buckets[count.index].name}"

  acl = var.buckets[count.index].acl

  dynamic "versioning" {
    for_each = var.buckets[count.index].versioning ? [1] : []
    content {
      enabled = true
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.buckets[count.index].name}"
    }
  )
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  count  = length(var.buckets)
  bucket  = aws_s3_bucket.this[count.index].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  count  = length(var.buckets)
  bucket = aws_s3_bucket.this[count.index].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count  = length(var.buckets)
  bucket = aws_s3_bucket.this[count.index].id

  rule {
    id      = "cleanup"
    enabled = true

    expiration {
      days = var.buckets[count.index].versioning ? 90 : 30
    }
  }
}

resource "aws_s3_bucket_logging" "this" {
  count  = length(var.buckets)
  bucket = aws_s3_bucket.this[count.index].id

  target_bucket = "${var.name_prefix}-logs"
  target_prefix = "s3/${aws_s3_bucket.this[count.index].id}/"
}

output "bucket_names" {
  description = "Names of S3 buckets"
  value       = aws_s3_bucket.this[*].id
}

output "bucket_arns" {
  description = "ARNs of S3 buckets"
  value       = aws_s3_bucket.this[*].arn
}

output "bucket_ids" {
  description = "IDs of S3 buckets"
  value       = aws_s3_bucket.this[*].id
}

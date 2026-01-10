data "aws_acm_certificate" "this" {
  count     = var.enable_ssl ? 1 : 0
  domain_name = "*.${var.domain_name}"
}

resource "aws_acm_certificate_validation" "this" {
  count    = var.enable_ssl ? 1 : 0
  email_address = "admin@${var.domain_name}"

  domain_name       = aws_acm_certificate.this[0].domain_name
  validation_record = "_acm-challenge"
}

resource "aws_cloudfront_origin_access_identity" "s3_oai" {
  comment = "S3 origin access identity for ${var.name_prefix}"
}

data "aws_iam_policy_document" "cloudfront_s3_policy" {
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal  = "*"
        Action     = "s3:GetObject"
        Resource   = "${var.s3_buckets[0]}/*"
      },
      {
        Effect    = "Allow"
        Principal  = {
          AWS        = aws_cloudfront_origin_access_identity.s3_oai.iam_arn
        }
        Action     = "s3:GetObject"
        Resource   = "${var.s3_buckets[0]}/*"
      }
    ]
  })
}

resource "aws_cloudfront_origin_control" "s3_origin" {
  origin_access_identity_id = aws_cloudfront_origin_access_identity.s3_oai.id
}

resource "aws_cloudfront_distribution" "main" {
  comment             = "CloudFront distribution for ${var.domain_name}"
  enabled            = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_cloudfront_origin_control.s3_origin.id
    forwarded_values {
      query_string = false
      cookies      = "none"
      headers      = ["origin"]
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl          = 0
    default_ttl      = 86400
    max_ttl          = 31536000
    compress         = true
  }

  dynamic "origin" {
    for_each = var.subdomains
    content {
      domain_name = "${each.value}.${var.domain_name}"
      origin_id   = "${each.value}-origin"
    }
  }

  dynamic "custom_origin" {
    for_each = var.s3_buckets
    content {
      domain_name = regex(replace(each.value, "^(https?://|s3://|s3\\.amazonaws\\.com/)", ""), ".*")
      origin_id   = "${each.value}-origin"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.enable_ssl ? aws_acm_certificate.this[0].arn : null
    ssl_support_method   = var.enable_ssl ? "sni-only" : null
    minimum_protocol_version = var.enable_ssl ? "TLSv1.2_2021" : null
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
    trusted_signers_enabled = false
    default_ttl            = 86400
  }

  aliases = formatlist("%s.${var.domain_name}", var.subdomains)

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-cloudfront-distribution"
    }
  )

  depends_on = [
    aws_acm_certificate_validation.this
  ]
}

data "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.id
  name    = var.domain_name
  type    = "A"

  alias {
    evaluate_target_health = true
    name                   = aws_cloudfront_distribution.main.domain_name
  }
}

dynamic "aws_route53_record" "subdomain" {
  for_each = var.subdomains
  content {
    zone_id = data.aws_route53_zone.main.id
    name    = "${each.value}.${var.domain_name}"
    type    = "CNAME"

    alias {
      evaluate_target_health = true
      name                   = aws_cloudfront_distribution.main.domain_name
    }
  }
}

output "cloudfront_distribution_id" {
  description = "ID of CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "acm_certificate_arn" {
  description = "ARN of ACM certificate"
  value       = var.enable_ssl ? aws_acm_certificate.this[0].arn : null
}

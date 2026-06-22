terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      # ACM certs for CloudFront must exist in us-east-1 regardless of the
      # primary region. The caller passes both providers via the providers map.
      configuration_aliases = [aws.us_east_1]
    }
  }
}

# ── Hosted zone ────────────────────────────────────────────────────────────
# For prod:    k-strong-bass.com
# For staging: staging.k-strong-bass.com
#
# After apply, copy the output name_servers to your registrar (prod) or add
# NS delegation records in the prod zone (staging).

resource "aws_route53_zone" "main" {
  name    = var.domain_name
  comment = "Managed by Terraform — ${var.project} ${var.environment}"

  tags = {
    Name = "${var.project}-${var.environment}-zone"
  }
}

# ── ACM certificate (us-east-1 — required for CloudFront) ─────────────────

resource "aws_acm_certificate" "main" {
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project}-${var.environment}-cert"
  }
}

# ── DNS records for ACM validation ────────────────────────────────────────

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]

  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "main" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}

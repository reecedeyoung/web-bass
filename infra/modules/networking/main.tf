# Reserves an Elastic IP for the future API server (ECS + ALB).
# The EIP exists independently of any instance — associate it later
# when the VPC and ECS service are provisioned.
#
# Note: AWS charges ~$0.005/hr for unattached EIPs. Tag it clearly
# so it is not mistaken for an orphan and released manually.

resource "aws_eip" "api" {
  domain = "vpc"

  tags = {
    Name      = "${var.project}-${var.environment}-api"
    Purpose   = "Reserved for API server — do not release"
  }
}

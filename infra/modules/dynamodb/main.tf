# ── Presets table ──────────────────────────────────────────────────────────
# PK: userId  (Cognito identity sub)
# SK: presetId (client-generated UUID)

resource "aws_dynamodb_table" "presets" {
  name         = "${var.project}-${var.environment}-presets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "presetId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "presetId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = {
    Name = "${var.project}-${var.environment}-presets"
  }
}

# ── Keyboard mappings table ────────────────────────────────────────────────
# PK: userId
# SK: mappingId

resource "aws_dynamodb_table" "keyboard_mappings" {
  name         = "${var.project}-${var.environment}-keyboard-mappings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "mappingId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "mappingId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = {
    Name = "${var.project}-${var.environment}-keyboard-mappings"
  }
}

# ── IAM inline policy — scoped to the caller's own rows ───────────────────
# The Condition uses cognito-identity sub as the leading key, so a logged-in
# user can only touch rows where userId == their own identity ID.

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.project}-${var.environment}-dynamodb-access"
  role = var.authenticated_role_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "OwnRowsOnly"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
        ]
        Resource = [
          aws_dynamodb_table.presets.arn,
          aws_dynamodb_table.keyboard_mappings.arn,
        ]
        Condition = {
          "ForAllValues:StringEquals" = {
            "dynamodb:LeadingKeys" = ["$${cognito-identity.amazonaws.com:sub}"]
          }
        }
      }
    ]
  })
}

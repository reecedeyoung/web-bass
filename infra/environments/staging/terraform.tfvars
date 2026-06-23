project     = "k-strong-bass"
environment = "staging"
aws_region  = "us-east-1"
domain_name = "staging.web-bass.com"

callback_urls = [
  "https://staging.web-bass.com",
  "http://localhost:5173",
]

logout_urls = [
  "https://staging.web-bass.com",
  "http://localhost:5173",
]

github_subject_claim = "repo:reecedeyoung/web-bass:environment:staging"

# Same zone ID as prod — both environments share the web-bass.com Cloudflare zone
cloudflare_zone_id = "03deefc15c0ee80a8945f549a0030845"

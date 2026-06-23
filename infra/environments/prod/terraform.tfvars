project     = "k-strong-bass"
environment = "prod"
aws_region  = "us-east-1"
domain_name = "web-bass.com"

callback_urls = [
  "https://web-bass.com",
  "https://www.web-bass.com",
]

logout_urls = [
  "https://web-bass.com",
  "https://www.web-bass.com",
]

# Replace with your actual GitHub org/username and repo name, then create a
# GitHub environment named "prod" in your repository settings.
github_subject_claim = "repo:reecedeyoung/web-bass:environment:prod"

# Cloudflare dashboard → web-bass.com → Overview → Zone ID (right sidebar)
cloudflare_zone_id = "03deefc15c0ee80a8945f549a0030845"

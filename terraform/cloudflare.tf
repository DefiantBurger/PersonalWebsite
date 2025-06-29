terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

provider "cloudflare" {
  api_token = data.google_secret_manager_secret_version.cloudflare-api-token.secret_data
}

resource "cloudflare_record" "website_a_record" {
  zone_id = data.google_secret_manager_secret_version.cloudflare-zone-id.secret_data
  name    = "@"
  content = google_compute_instance.default.network_interface.0.access_config.0.nat_ip
  type    = "A"
  proxied = true
  comment = "Redirect to flask app"
}

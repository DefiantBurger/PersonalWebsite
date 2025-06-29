data "google_secret_manager_secret_version" "cloudflare-origin-certificate" {
  provider = google-beta

  secret = "cloudflare-origin-certificate"
}

data "google_secret_manager_secret_version" "cloudflare-private-key" {
  provider = google-beta

  secret = "cloudflare-private-key"
}

data "google_secret_manager_secret_version" "cloudflare-api-token" {
  provider = google-beta

  secret = "cloudflare-api-token"
}

data "google_secret_manager_secret_version" "cloudflare-zone-id" {
  provider = google-beta

  secret = "cloudflare-zone-id"
}
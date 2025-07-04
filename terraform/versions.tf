terraform {
  required_version = ">= 1.12.2, < 2.0.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.42.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.42.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}
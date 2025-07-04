provider "google" {
  project = var.project_id
  region  = var.project_region
}

provider "google-beta" {
  project = var.project_id
  region  = var.project_region
}

resource "google_compute_network" "vpc_network" {
  name                    = "my-custom-mode-network"
  auto_create_subnetworks = false
  mtu                     = 1460
}

resource "google_compute_subnetwork" "default" {
  name          = "my-custom-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.project_region
  network       = google_compute_network.vpc_network.id
}


# data "template_file" "nginx_conf" {
#   template = file("${path.module}/nginx.tftpl")
#   vars = {
#     domain   = var.domain
#     app_path = var.app_path
#   }
# }

# data "template_file" "flaskapp_service" {
#   template = file("${path.module}/flaskapp.service.tftpl")
#   vars = {
#     app_path = var.app_path
#   }
# }

locals {
  nginx_conf = templatefile("${path.module}/nginx.tftpl", {
    domain   = var.domain
    app_path = var.app_path
  })
  flaskapp_service = templatefile("${path.module}/flaskapp.service.tftpl", {
    app_path = var.app_path
  })
}


# Create a single Compute Engine instance
resource "google_compute_instance" "default" {
  name         = "flask-vm"
  machine_type = "e2-micro"
  zone         = var.project_zone
  tags = ["ssh"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  metadata_startup_script = <<EOT
#!/bin/bash

# Redirect all output to serial port and a log file for visibility
exec > >(tee /dev/console | tee -a /var/log/startup-script.log) 2>&1

echo "===== Startup Script Begin ====="

echo "[1/6] Updating packages..."
sudo apt-get update

echo "[2/6] Installing dependencies..."
sudo apt-get install -yq build-essential python3-pip python3-venv rsync git tmux nginx

echo "[3/6] Cloning Flask app..."
git clone https://github.com/DefiantBurger/PersonalWebsite ${var.app_path}
cd ${var.app_path}

echo "[4/6] Setting up virtual environment and installing requirements..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[5/6] Creating systemd service for Flask app..."
echo "${local.flaskapp_service}" | tee /etc/systemd/system/flaskapp.service

echo "Enabling and starting flaskapp.service..."
systemctl daemon-reexec
systemctl daemon-reload
systemctl enable flaskapp
systemctl start flaskapp

echo "[6/6] Setting up Nginx reverse proxy..."
mkdir ${var.app_path}/certs
echo "${data.google_secret_manager_secret_version.cloudflare-origin-certificate.secret_data}" | sudo tee ${var.app_path}/certs/cloudflare.crt > /dev/null
echo "${data.google_secret_manager_secret_version.cloudflare-private-key.secret_data}" | sudo tee ${var.app_path}/certs/cloudflare.key > /dev/null

echo "${local.nginx_conf}" | tee /etc/nginx/sites-available/default

systemctl restart nginx


echo "===== Startup Script Complete ====="
EOT


  network_interface {
    subnetwork = google_compute_subnetwork.default.id

    access_config {
      # Include this section to give the VM an external IP address
    }
  }
}

resource "google_compute_firewall" "ssh" {
  name = "allow-ssh"
  allow {
    ports = ["22"]
    protocol = "tcp"
  }
  direction = "INGRESS"
  network   = google_compute_network.vpc_network.id
  priority  = 1000
  source_ranges = ["0.0.0.0/0"]
  target_tags = ["ssh"]
}

resource "google_compute_firewall" "flask" {
  name    = "flask-app-firewall"
  network = google_compute_network.vpc_network.id

  allow {
    protocol = "tcp"
    ports = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"]
}

output "Web-server-URL" {
  description = "The IP for the website"
  value       = google_compute_instance.default.network_interface[0].access_config[0].nat_ip
}

# TODO: run the flask app as a dedicated user for security
variable "domain" {
  description = "The domain name you are configuring."
  type        = string
  default     = "josephcicalese.com"
}

variable "app_path" {
  description = "Path of the flask app"
  type        = string
  default     = "/opt/flaskapp"
}
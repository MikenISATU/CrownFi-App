terraform {
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4.0"
    }
  }
}

provider "null" {}
provider "local" {}

variable "deploy_trigger" {
  type        = string
  default     = ""
  description = "A unique trigger (e.g. Git commit SHA) to force container recreation."
}

# 🚀 Shared Arcturus Deploy Module
# Handles: ingress routing, compose deployment, stack restart, and destroy cleanup
module "arcturus_deploy" {
  source = "/terraform-modules/arcturus-deploy"

  app_name        = "stellar-project"
  domain          = "stellar-project.u128.org"
  tier            = "complex"
  target_url      = "http://web:3000"
  compose_content = file("../infra/docker-compose.yml")
  deploy_trigger  = var.deploy_trigger
}

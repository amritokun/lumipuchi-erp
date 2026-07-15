# Production Deployment Guide

This guide explains how to deploy Lumipuchi ERP to a Linux Virtual Private Server (VPS) like DigitalOcean, AWS EC2, or Hetzner using a single command. The deployment is fully dockerized and uses **Caddy** to automatically provision and renew free SSL certificates (HTTPS) for your custom domain.

## Prerequisites

1.  **A Linux VPS**: Ubuntu 22.04 LTS or Debian is recommended.
2.  **A Custom Domain Name**: You must own a domain (e.g., `lumipuchi.in`).
3.  **Docker and Docker Compose**: Must be installed on your VPS.

## Step 1: Configure DNS Records

Before starting the server, you must point your domain to your VPS's public IP address. Caddy requires valid DNS records to issue SSL certificates automatically.

Go to your domain registrar's DNS settings (e.g., Cloudflare, GoDaddy, Namecheap) and create **two A Records**:

| Type | Name / Host | Target / Value / Points To | Proxy Status (Cloudflare) |
| :--- | :--- | :--- | :--- |
| **A** | `admin` | `<Your_VPS_IP_Address>` | ⚠️ **DNS Only** (Grey Cloud) |
| **A** | `api` | `<Your_VPS_IP_Address>` | ⚠️ **DNS Only** (Grey Cloud) |

> [!WARNING]
> **Cloudflare Users:** If you use Cloudflare, you **MUST** set the Proxy Status to "DNS Only" (Grey Cloud) for both records. If you leave them proxied (Orange Cloud), Caddy will fail to generate your Let's Encrypt SSL certificates because Cloudflare intercepts the traffic.

*Note: DNS propagation can take a few minutes to an hour. You can verify your DNS has propagated using a tool like [dnschecker.org](https://dnschecker.org).*

## Step 2: Install Docker (If not installed)

SSH into your Linux VPS and run the official Docker installation script:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## Step 3: Clone the Repository

Clone your Lumipuchi ERP repository onto the server:

```bash
git clone https://github.com/amritokun/lumipuchi-erp.git
cd lumipuchi-erp
```

## Step 4: The One-Command Deployment

Once inside the repository folder, you can spin up the entire production stack using Docker Compose. 

Just define your web and API domains using environment variables and point Docker to the production config file:

```bash
WEB_DOMAIN=admin.lumipuchi.in API_DOMAIN=api.lumipuchi.in sudo -E docker compose -f docker-compose.prod.yml up -d
```
*(Replace the domains with your actual desired subdomains if different)*

### What happens in the background?
1.  **PostgreSQL & Redis** containers spin up for your database and caching layer.
2.  **FastAPI (Backend)** builds and starts listening on port 8000 internally.
3.  **Next.js (Frontend)** builds an optimized production bundle and starts on port 3000.
4.  **Caddy** boots up, detects your domains, automatically fetches HTTPS certificates from Let's Encrypt, and routes external web traffic cleanly to your frontend and backend containers.

## Step 5: Verify Your Deployment

Open your browser and navigate to:
*   Frontend: `https://admin.lumipuchi.in`
*   Backend API Docs: `https://api.lumipuchi.in/docs`

## Updating the App in the Future

When you push new code to your GitHub repository and want to update your live server, simply SSH in and run:

```bash
cd lumipuchi-erp
git pull origin main
WEB_DOMAIN=admin.lumipuchi.in API_DOMAIN=api.lumipuchi.in sudo -E docker compose -f docker-compose.prod.yml up -d --build
```
This pulls the new code, rebuilds the containers without downtime, and gracefully restarts the services!

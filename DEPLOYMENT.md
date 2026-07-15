# Production Deployment Guide

This guide explains how to deploy Lumipuchi ERP to a Linux Virtual Private Server (VPS) like DigitalOcean, AWS EC2, or Hetzner using a single command. The deployment is fully dockerized and uses **Caddy** to automatically provision and renew free SSL certificates (HTTPS) for your custom domain.

## Prerequisites

1.  **A Linux VPS**: Ubuntu 22.04 LTS or Debian is recommended.
2.  **A Custom Domain Name**: You must own a domain (e.g., `lumipuchi.in`).
3.  **Docker and Docker Compose**: Must be installed on your VPS.

## Step 1: Configure DNS Records

Before starting the server, you must point your domain to your VPS's public IP address. Caddy requires valid DNS records to issue SSL certificates.

Go to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare) and create **two A Records**:

1.  **Host/Name:** `@` (or leave blank) -> **Value/Points To:** `<Your_VPS_IP>`
2.  **Host/Name:** `api` -> **Value/Points To:** `<Your_VPS_IP>`

*Note: DNS propagation can take a few minutes to an hour.*

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

Just define your domain using the `DOMAIN` environment variable and point Docker to the production config file:

```bash
DOMAIN=yourdomain.com sudo -E docker compose -f docker-compose.prod.yml up -d
```
*(Replace `yourdomain.com` with your actual domain, e.g., `lumipuchi.in`)*

### What happens in the background?
1.  **PostgreSQL & Redis** containers spin up for your database and caching layer.
2.  **FastAPI (Backend)** builds and starts listening on port 8000 internally.
3.  **Next.js (Frontend)** builds an optimized production bundle and starts on port 3000.
4.  **Caddy** boots up, detects your `DOMAIN`, automatically fetches HTTPS certificates from Let's Encrypt, and routes external web traffic cleanly to your frontend and backend containers.

## Step 5: Verify Your Deployment

Open your browser and navigate to:
*   Frontend: `https://yourdomain.com`
*   Backend API Docs: `https://api.yourdomain.com/docs`

## Updating the App in the Future

When you push new code to your GitHub repository and want to update your live server, simply SSH in and run:

```bash
cd lumipuchi-erp
git pull origin main
DOMAIN=yourdomain.com sudo -E docker compose -f docker-compose.prod.yml up -d --build
```
This pulls the new code, rebuilds the containers without downtime, and gracefully restarts the services!

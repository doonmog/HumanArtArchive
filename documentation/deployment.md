# Deploying HumanArtArchive to your VPS with Cloudflare

This guide will walk you through deploying your Nuxt.js application and backend API to your Virtual Private Server (VPS) and pointing your domain to it using Cloudflare.

## Prerequisites

- A VPS with a public IP address (`46.203.233.142`).
- Your domain `humanartarchive.com` managed in Cloudflare.
- SSH access to your VPS.
- `git`, `docker`, and `docker-compose` installed on your VPS.

## Step 1: Cloudflare DNS Configuration

1.  Log in to your Cloudflare dashboard.
2.  Select your domain `humanartarchive.com`.
3.  Go to the **DNS** section.
4.  Add an **A record** pointing to your VPS IP address:
    -   **Type:** `A`
    -   **Name:** `@` (for the root domain)
    -   **IPv4 address:** `46.203.233.142`
    -   **Proxy status:** Proxied (orange cloud). This enables Cloudflare's CDN and security features.
5.  Add a **CNAME record** for `www` if you want to use it:
    -   **Type:** `CNAME`
    -   **Name:** `www`
    -   **Target:** `humanartarchive.com`
    -   **Proxy status:** Proxied.

## Step 2: Cloudflare SSL/TLS Configuration

1.  In your Cloudflare dashboard, go to the **SSL/TLS** section.
2.  Set the SSL/TLS encryption mode to **Full (Strict)**. This is the most secure option.
3.  Go to the **Origin Server** tab.
4.  Click **Create Certificate**.
5.  Keep the default settings and click **Next**.
6.  Cloudflare will generate an **Origin Certificate** and a **Private Key**. Copy both of these. You will need them for your Nginx configuration on the VPS.

## Step 3: Server Setup (Nginx and Application)

You will use Nginx as a reverse proxy to direct traffic to your Nuxt frontend and your backend API.

1.  **SSH into your VPS.**

2.  **Clone your repository:**
    ```bash
    git clone <your-repository-url> HumanArtArchive
    cd HumanArtArchive
    ```

3.  **Create SSL certificate files:**
    -   Create a directory to store your certificates:
        ```bash
        sudo mkdir -p /etc/nginx/ssl
        ```
    -   Create the certificate file and paste the Cloudflare Origin Certificate into it:
        ```bash
        sudo nano /etc/nginx/ssl/humanartarchive.com.pem
        ```
    -   Create the private key file and paste the Cloudflare Private Key into it:
        ```bash
        sudo nano /etc/nginx/ssl/humanartarchive.com.key
        ```

4.  **Configure Nginx:**
    -   Copy the provided `nginx/nginx.conf` to the Nginx configuration directory.
        ```bash
        sudo cp nginx/nginx.conf /etc/nginx/sites-available/humanartarchive.com
        ```
    -   Create a symbolic link to enable the site:
        ```bash
        sudo ln -s /etc/nginx/sites-available/humanartarchive.com /etc/nginx/sites-enabled/
        ```
    -   Test the Nginx configuration:
        ```bash
        sudo nginx -t
        ```
    -   If the test is successful, restart Nginx:
        ```bash
        sudo systemctl restart nginx
        ```

5.  **Run your application:**
    -   The `docker-compose.yml` file should be configured to build and run your frontend, backend, and database containers.
    -   Start the application using Docker Compose:
        ```bash
        docker-compose up -d --build
        ```

## Step 4: Firewall Configuration

Ensure your VPS firewall allows traffic on ports 80 and 443.

If you are using `ufw`:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Your website should now be live at `https://humanartarchive.com`.

#!/usr/bin/env bash
set -euo pipefail

echo "=== Ordinary Note VM Setup ==="

# System update
sudo apt-get update && sudo apt-get upgrade -y

# Node.js 20 (via NodeSource)
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node -v)"

# pnpm
if ! command -v pnpm &>/dev/null; then
  sudo npm install -g pnpm
fi
echo "pnpm: $(pnpm -v)"

# PM2
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
  pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash
fi
echo "PM2: $(pm2 -v)"

# Nginx
if ! command -v nginx &>/dev/null; then
  sudo apt-get install -y nginx
  sudo systemctl enable nginx
fi
echo "Nginx: $(nginx -v 2>&1)"

# Certbot
if ! command -v certbot &>/dev/null; then
  sudo apt-get install -y certbot python3-certbot-nginx
fi

# Litestream
if ! command -v litestream &>/dev/null; then
  LITESTREAM_VERSION="v0.3.13"
  wget -q "https://github.com/benbjohnson/litestream/releases/download/${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-amd64.deb"
  sudo dpkg -i "litestream-${LITESTREAM_VERSION}-linux-amd64.deb"
  rm "litestream-${LITESTREAM_VERSION}-linux-amd64.deb"
fi
echo "Litestream: $(litestream version)"

# AWS CLI
if ! command -v aws &>/dev/null; then
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp
  sudo /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi
echo "AWS CLI: $(aws --version)"

# Setup Nginx config
sudo cp /home/ubuntu/ordinary-note/deploy/nginx/ordinary-note-api.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/ordinary-note-api.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Setup Litestream service
sudo cp /home/ubuntu/ordinary-note/deploy/litestream.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable litestream

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Run: sudo certbot --nginx -d ordinary-note-api.yunji.kim"
echo "  2. Configure AWS credentials: aws configure"
echo "  3. Create packages/server/.env with production values"
echo "  4. Run deploy-backend.sh"

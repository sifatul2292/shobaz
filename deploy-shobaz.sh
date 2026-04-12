#!/bin/bash

# Shobaz Deployment Script
# This deploys the new shobaz site on different ports to avoid conflicts with existing site

set -e

echo "🚀 Starting Shobaz Deployment..."

# Configuration - CHANGE THESE for your new site
SITE_NAME="shobaz-new"
SITE_DIR="/var/www/$SITE_NAME"
GIT_REPO="https://github.com/sifatul2292/shobaz.git"

# Ports - Using different ports to avoid conflict with existing site
BACKEND_PORT=3002
FRONTEND_PORT=3003

# Domain for new site (change to your actual domain)
DOMAIN="shobaz-new.yourdomain.com"
EMAIL="your-email@example.com"  # Change for SSL certificate

echo "📁 Creating site directory..."
sudo mkdir -p $SITE_DIR
cd $SITE_DIR

echo "📦 Cloning repository..."
sudo git clone $GIT_REPO .

echo "🔧 Setting up Backend..."
cd $SITE_DIR/backend
sudo cp .env.example .env

# Update backend port in .env
echo "PORT=$BACKEND_PORT" | sudo tee -a .env
echo "PRODUCTION_BUILD=true" | sudo tee -a .env

# Install and build backend
sudo npm install
sudo npm run build

echo "🔧 Setting up Frontend..."
cd $SITE_DIR/frontend
sudo cp .env.example .env.local

# Update frontend API URL to point to new backend
echo "NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT" | sudo tee .env.local

# Install and build frontend
sudo npm install
sudo npm run build

echo "⚙️ Starting applications with PM2..."

# Start backend
cd $SITE_DIR/backend
pm2 start dist/main.js --name "$SITE_NAME-backend" -- --port $BACKEND_PORT

# Start frontend
cd $SITE_DIR/frontend
pm2 start npm --name "$SITE_NAME-frontend" -- run start -- --port $FRONTEND_PORT

# Save PM2 config
pm2 save

echo "🌐 Configuring Nginx..."

# Create Nginx config (HTTP first, HTTPS will be added after SSL)
sudo cat > /etc/nginx/sites-available/$SITE_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$SITE_NAME /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "🔒 Setting up SSL (Let's Encrypt)..."

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

echo "✅ Deployment Complete!"
echo ""
echo "📝 Summary:"
echo "  - Backend: http://localhost:$BACKEND_PORT"
echo "  - Frontend: http://localhost:$FRONTEND_PORT"
echo "  - Domain: https://$DOMAIN"
echo "  - SSL: Enabled (Let's Encrypt)"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env files with your actual values"
echo "  2. Point your domain DNS to this server"
echo "  3. Run: pm2 restart $SITE_NAME-backend $SITE_NAME-frontend"
echo ""
echo "🔧 To manage:"
echo "  - View logs: pm2 logs $SITE_NAME-backend"
echo "  - Restart: pm2 restart $SITE_NAME-backend"
echo "  - Stop: pm2 stop $SITE_NAME-backend $SITE_NAME-frontend"
echo ""
echo "🔄 SSL Auto-renewal is enabled (certbot handles this automatically)"
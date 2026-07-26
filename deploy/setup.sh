#!/bin/bash
set -euo pipefail

DOMAIN="sijil.yourdomain.com"
APP_DIR="/opt/sijil-mutabaah"
DB_NAME="sijil_db"
DB_USER="sijil"

echo "=== Sijil Mutabaah — Server Setup ==="

# 1. Create system user
if ! id -u sijil &>/dev/null; then
    sudo useradd -r -s /bin/false sijil
    echo "Created user: sijil"
fi

# 2. Create app directory
sudo mkdir -p "$APP_DIR"
sudo chown sijil:sijil "$APP_DIR"

# 3. Clone/copy app (run from repo root)
echo "Copying app files..."
sudo rsync -av --exclude='node_modules' --exclude='.git' --exclude='deploy' \
    ./ "$APP_DIR/"
sudo chown -R sijil:sijil "$APP_DIR"

# 4. Install dependencies & build
echo "Installing dependencies..."
cd "$APP_DIR"
sudo -u sijil bun install
sudo -u sijil bun run build

# 5. PostgreSQL setup
echo "Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD 'CHANGE_ME';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# 6. Create .env if not exists
if [ ! -f "$APP_DIR/.env" ]; then
    SECRET=$(openssl rand -base64 32)
    cat > "$APP_DIR/.env" <<EOF
DATABASE_URL=postgresql://${DB_USER}:CHANGE_ME@localhost:5432/${DB_NAME}
BETTER_AUTH_SECRET=${SECRET}
BETTER_AUTH_URL=https://${DOMAIN}
TRUSTED_ORIGINS=https://${DOMAIN}
EOF
    sudo chown sijil:sijil "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo "Created .env — edit it to set the correct DB password!"
fi

# 7. Run migrations
echo "Running database migrations..."
sudo -u sijil bunx drizzle-kit push

# 8. Install systemd service
sudo cp "$APP_DIR/deploy/sijil-mutabaah.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sijil-mutabaah
sudo systemctl start sijil-mutabaah

echo ""
echo "=== Done! ==="
echo "App running on http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env — set the correct DB password"
echo "  2. Set up nginx: sudo cp $APP_DIR/deploy/nginx-sijil.conf /etc/nginx/conf.d/"
echo "     Edit the file to set your actual domain"
echo "  3. Set up SSL: sudo certbot certonly --nginx -d $DOMAIN"
echo "  4. Restart: sudo systemctl restart nginx"
echo "  5. Restart app: sudo systemctl restart sijil-mutabaah"

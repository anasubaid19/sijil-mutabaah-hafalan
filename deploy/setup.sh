#!/bin/bash
set -euo pipefail

# Sijil Mutabaah — Server Setup
# Usage: bash deploy/setup.sh [--domain DOMAIN] [--app-dir DIR] [--db-name NAME] [--db-user USER]

# Defaults
DOMAIN=""
APP_DIR="/opt/sijil-mutabaah"
DB_NAME="sijil_db"
DB_USER="sijil"

# Parse flags
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift 2 ;;
        --app-dir) APP_DIR="$2"; shift 2 ;;
        --db-name) DB_NAME="$2"; shift 2 ;;
        --db-user) DB_USER="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Interactive prompts for missing values
if [ -z "$DOMAIN" ]; then
    read -rp "Domain (e.g. sijil.example.com): " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo "Error: domain is required"
    exit 1
fi

read -rp "App directory [${APP_DIR}]: " INPUT_DIR
APP_DIR="${INPUT_DIR:-$APP_DIR}"

read -rp "DB name [${DB_NAME}]: " INPUT_DB
DB_NAME="${INPUT_DB:-$DB_NAME}"

read -rp "DB user [${DB_USER}]: " INPUT_USER
DB_USER="${INPUT_USER:-$DB_USER}"

read -rp "DB password: " DB_PASS
if [ -z "$DB_PASS" ]; then
    echo "Error: DB password is required"
    exit 1
fi

echo ""
echo "=== Konfigurasi ==="
echo "  Domain:    $DOMAIN"
echo "  Port:      26726 (static)"
echo "  App dir:   $APP_DIR"
echo "  DB:        $DB_NAME (user: $DB_USER)"
echo ""
read -rp "Lanjutkan? [Y/n] " CONFIRM
if [[ "${CONFIRM,,}" == "n" ]]; then
    echo "Dibatalkan."
    exit 0
fi

echo ""
echo "=== Sijil Mutabaah — Setup ==="

# 1. Create system user
SYSTEM_USER=$(basename "$APP_DIR" | tr '-' '_')
if ! id -u "$SYSTEM_USER" &>/dev/null; then
    sudo useradd -r -s /bin/false "$SYSTEM_USER"
    echo "[+] Created user: $SYSTEM_USER"
fi

# 2. Create app directory
sudo mkdir -p "$APP_DIR"
sudo chown "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR"

# 3. Copy app files (run from repo root)
echo "[+] Copying app files..."
sudo rsync -av --exclude='node_modules' --exclude='.git' --exclude='deploy' \
    ./ "$APP_DIR/"
sudo chown -R "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR"

# 4. Install dependencies & build
echo "[+] Installing dependencies..."
cd "$APP_DIR"
sudo -u "$SYSTEM_USER" bun install
sudo -u "$SYSTEM_USER" bun run build

# 5. PostgreSQL setup
echo "[+] Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# 6. Create .env
if [ ! -f "$APP_DIR/.env" ]; then
    SECRET=$(openssl rand -base64 32)
    cat > "$APP_DIR/.env" <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
BETTER_AUTH_SECRET=${SECRET}
BETTER_AUTH_URL=https://${DOMAIN}
TRUSTED_ORIGINS=https://${DOMAIN}
EOF
    sudo chown "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo "[+] Created .env"
else
    echo "[*] .env already exists, skipping"
fi

# 7. Run migrations
echo "[+] Running database migrations..."
sudo -u "$SYSTEM_USER" bunx drizzle-kit push

# 8. Install systemd service
sudo cp "$APP_DIR/deploy/sijil-mutabaah.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sijil-mutabaah
sudo systemctl start sijil-mutabaah

echo ""
echo "=== Selesai! ==="
echo "App berjalan di http://localhost:26726"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Setup nginx: sudo cp $APP_DIR/deploy/nginx-sijil.conf /etc/nginx/conf.d/"
echo "     Edit file tersebut, ganti 'sijil.yourdomain.com' dengan '$DOMAIN'"
echo "     Ganti port '3000' dengan '$PORT'"
echo "  2. Setup SSL: sudo certbot certonly --nginx -d $DOMAIN"
echo "  3. Restart: sudo systemctl restart nginx"
echo "  4. Restart app: sudo systemctl restart sijil-mutabaah"

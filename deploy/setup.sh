#!/usr/bin/env bash
# =============================================================================
# Shraddha Garden — one-shot provisioning for a single Ubuntu EC2 instance.
#
# Serves the built frontend with Nginx and runs the Node/Express API (SQLite)
# under PM2, both behind Nginx on port 80. Safe to re-run.
#
# Run it from the project's deploy/ directory on the server:
#   cd ~/resort/deploy && chmod +x setup.sh && ./setup.sh
# =============================================================================
set -euo pipefail

# --- locate the project root (parent of this deploy/ dir) --------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API="$ROOT/api"
WEBROOT="$ROOT/dist"

echo "==> Project root: $ROOT"

# --- 1. system packages ------------------------------------------------------
echo "==> Installing system packages…"
sudo apt-get update -y
sudo apt-get install -y curl git nginx build-essential

# --- 2. swap (helps npm/vite build on small 1 GB instances) ------------------
MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$MEM_MB" -lt 2048 ] && [ ! -f /swapfile ]; then
  echo "==> Low RAM (${MEM_MB} MB) — adding 2 GB swap…"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# --- 3. Node.js 22 LTS + PM2 -------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  echo "==> Installing Node.js 22…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo npm install -g pm2

echo "==> Node $(node -v), npm $(npm -v)"

# --- 4. frontend build -------------------------------------------------------
echo "==> Building frontend…"
cd "$ROOT"
# Guarantee same-origin (relative) API calls in the production bundle.
echo "VITE_API_URL=" > "$ROOT/.env.production"
npm ci
npx vite build   # uses esbuild; skips the strict tsc type-check step

# --- 5. API: env, database, build -------------------------------------------
echo "==> Setting up API…"
cd "$API"
npm ci

FIRST_RUN=false
if [ ! -f "$API/prisma/dev.db" ]; then FIRST_RUN=true; fi

# Generate api/.env with strong secrets on first run.
ADMIN_PASSWORD=""
if [ ! -f "$API/.env" ]; then
  echo "==> Writing api/.env with generated secrets…"
  ACCESS=$(openssl rand -hex 32)
  REFRESH=$(openssl rand -hex 32)
  # seed.ts rejects passwords shorter than 12 chars — generate a random one.
  ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=' | head -c 16)
  cat > "$API/.env" <<EOF
DATABASE_URL="file:./dev.db"
PORT=4000
CORS_ORIGINS="http://localhost:5173"
JWT_ACCESS_SECRET="$ACCESS"
JWT_REFRESH_SECRET="$REFRESH"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
SEED_ADMIN_EMAIL="admin@shraddhagarden.com"
SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD"
# Public origin used to build links inside emails. Update this to your domain
# once you have one (e.g. https://shraddhagarden.com), then: pm2 restart resort-api
PUBLIC_URL="http://$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 || echo localhost)"
EOF
fi

npx prisma generate
npx prisma db push

if [ "$FIRST_RUN" = true ]; then
  echo "==> First run — seeding database (users, content, menu, add-ons)…"
  npm run seed || true
  npm run seed:content || true
  npm run seed:menu || true
  npm run seed:addons || true
fi

echo "==> Building API…"
npm run build

# --- 6. PM2 process for the API ---------------------------------------------
echo "==> Starting API under PM2…"
cd "$API"
pm2 delete resort-api >/dev/null 2>&1 || true
pm2 start dist/src/server.js --name resort-api --cwd "$API"
pm2 save
# Configure PM2 to start on boot (prints a line you may need to run once).
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true
pm2 save

# --- 7. Nginx site -----------------------------------------------------------
echo "==> Configuring Nginx…"
sudo sed "s#__WEBROOT__#$WEBROOT#g" "$SCRIPT_DIR/nginx.conf" | sudo tee /etc/nginx/sites-available/resort >/dev/null
sudo ln -sf /etc/nginx/sites-available/resort /etc/nginx/sites-enabled/resort
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# --- done --------------------------------------------------------------------
IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 || echo "<your-ec2-ip>")
echo ""
echo "============================================================"
echo "  Done. Your site should be live at:  http://$IP"
echo "  Admin portal:                        http://$IP/admin"
if [ -n "$ADMIN_PASSWORD" ]; then
  echo "  Login: admin@shraddhagarden.com / $ADMIN_PASSWORD"
  echo "         (record this now — it is not shown again)"
else
  echo "  Login: admin@shraddhagarden.com (password in api/.env)"
fi
echo "============================================================"

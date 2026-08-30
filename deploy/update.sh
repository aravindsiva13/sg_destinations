#!/usr/bin/env bash
# =============================================================================
# Redeploy after uploading new code. Rebuilds frontend + API and restarts.
# Does NOT re-seed the database (your live data is preserved).
#   cd ~/resort/deploy && ./update.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API="$ROOT/api"

# The current codebase requires Node >= 20.19 (Vite 8); move to Node 22 LTS
# (9 EOL) if the server is still on an older release.
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  echo "==> Installing Node.js 22…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Rebuilding frontend…"
cd "$ROOT"
echo "VITE_API_URL=" > "$ROOT/.env.production"
npm ci
npx vite build

echo "==> Rebuilding API…"
cd "$API"
npm ci
npx prisma generate
npx prisma db push          # applies any new schema changes (non-destructive)
npm run build

echo "==> Restarting API + applying Nginx config + reloading…"
pm2 restart resort-api
# Re-apply the nginx template (picks up security-header changes), then reload.
# sudo sed "s#__WEBROOT__#$ROOT/dist#g" "$SCRIPT_DIR/nginx.conf" | sudo tee /etc/nginx/sites-available/resort >/dev/null
if sudo nginx -t; then sudo systemctl reload nginx; fi

echo "==> Done."

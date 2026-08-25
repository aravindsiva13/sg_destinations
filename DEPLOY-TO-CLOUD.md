# Deploy Shraddha Garden to the cloud (quick path)

Your app now runs as **one service**: the API serves the website *and* the API
from a single port. That makes cloud deployment simple.

**Recommended host: Railway** (~$5/month, always-on, keeps your SQLite database).

---

## Step 1 — Put your code on GitHub (~5 min)

Cloud hosts deploy from GitHub. In **Git Bash**, from the project folder:

```bash
cd "/c/Users/Arvind Siva/Downloads/Projects/resort"
git init
git add .
git commit -m "Shraddha Garden resort site"
```

Then create an empty repo at <https://github.com/new> (name: `shraddha-garden`,
set it **Private**), and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/shraddha-garden.git
git branch -M main
git push -u origin main
```

> `.gitignore` already excludes your secrets (`api/.env`, `ngrok.txt`, the local
> database). Double-check none of them appear in `git status` before pushing.

---

## Step 2 — Deploy on Railway (~5 min)

1. Go to <https://railway.app> → **Login with GitHub**.
2. **New Project → Deploy from GitHub repo** → pick `shraddha-garden`.
3. Railway detects the `Dockerfile` and builds automatically.

### Add a volume (IMPORTANT — keeps your data)
Your database is a file. Without a volume it resets on every redeploy.
- Open the service → **Variables/Settings → Volumes → New Volume**
- **Mount path:** `/data`

### Set environment variables
Service → **Variables** → add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `file:/data/prod.db` |
| `JWT_ACCESS_SECRET` | a long random string |
| `JWT_REFRESH_SECRET` | a different long random string |
| `SEED_ADMIN_EMAIL` | your admin email |
| `SEED_ADMIN_PASSWORD` | a strong password |
| `PUBLIC_URL` | your Railway URL (add after step 3) |

Generate secrets in Git Bash: `openssl rand -hex 32`

### Get your URL
Service → **Settings → Networking → Generate Domain**.
You'll get something like `shraddha-garden-production.up.railway.app`.
Put that (with `https://`) into `PUBLIC_URL` and redeploy.

---

## Step 3 — Seed the database (first deploy only)

The container runs `prisma db push` automatically, but the tables start empty.
Open Railway's service **Shell/Terminal** and run:

```bash
cd /app/api
npx tsx prisma/seed.ts
npx tsx prisma/seed-content.ts
npx tsx prisma/seed-menu.ts
```

(If `tsx` isn't available in the runtime image, run these locally against a copy
and upload, or ask Claude to add a seed script to the container.)

Then open your URL — the site is live 24/7. Admin at `/admin`.

---

## Step 4 — Post-deploy checklist

- [ ] **Change the admin password** immediately (Admin → Users & Staff).
- [ ] Admin → **Email**: paste your Brevo API key, set From address, send a test.
- [ ] Admin → **Settings**: confirm resort name, contact, check-in/out times.
- [ ] Consider a **custom domain** (Railway → Settings → Custom Domain). This
      also improves email deliverability and removes tunnel/ngrok warnings.

---

## Alternatives (same Dockerfile works)

| Host | Notes | Cost |
|---|---|---|
| **Render** | Web Service from repo + a Disk mounted at `/data` | free tier sleeps; ~$7/mo always-on |
| **Fly.io** | `fly launch` + `fly volumes create` | ~$5/mo |
| **Any VPS / AWS EC2** | Use `deploy/setup.sh` (no Docker needed) | ~$5–10/mo |

---

## Updating the site later
```bash
git add .
git commit -m "describe your change"
git push
```
Railway rebuilds and redeploys automatically. Your data on `/data` is preserved.

---

## Local development is unchanged
`START-WEBSITE.bat` still works exactly as before for local/tunnel hosting.

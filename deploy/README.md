# Deploying Shraddha Garden to AWS (single EC2)

This hosts the **whole app on one EC2 server**: Nginx serves the built website
and reverse-proxies the API; the Node/Express API runs under PM2; the database
stays as the existing SQLite file. Cheapest and simplest — free-tier eligible.

```
        Internet
           │  http://<your-ec2-ip>
           ▼
   ┌──────────────── EC2 (Ubuntu) ────────────────┐
   │  Nginx (port 80)                              │
   │    ├─ serves  dist/         (the website)     │
   │    └─ /api →  127.0.0.1:4000                  │
   │  Node API (PM2, port 4000) ── SQLite dev.db   │
   └───────────────────────────────────────────────┘
```

**Rough cost:** `t3.micro`/`t2.micro` is free-tier for 12 months, then ~$8–10/mo.
`t3.small` (recommended for smoother builds) ~$15/mo. Plus a few cents for the disk.

---

## Prerequisites
- An AWS account.
- An SSH key pair (you'll create one while launching, download the `.pem`).
- The `scp`/`tar`/`ssh` commands — already available in **Git Bash** on your PC
  (and in PowerShell on Windows 10+).

---

## Step 1 — Launch the EC2 instance
1. AWS Console → **EC2** → **Launch instance**.
2. **Name:** `shraddha-garden`
3. **AMI:** *Ubuntu Server 24.04 LTS* (or 22.04 LTS).
4. **Instance type:** `t3.small` (recommended) or `t2.micro` (free tier).
5. **Key pair:** create one → download `shraddha-key.pem`, keep it safe.
6. **Network / Security group** — create one allowing inbound:
   | Type  | Port | Source          | Why                    |
   |-------|------|-----------------|------------------------|
   | SSH   | 22   | *My IP*         | you, to administer     |
   | HTTP  | 80   | Anywhere (0.0.0.0/0) | public website    |
   | HTTPS | 443  | Anywhere (0.0.0.0/0) | for later (domain)|
7. **Storage:** 20 GB gp3.
8. **Launch.**

## Step 2 — Give it a stable IP (Elastic IP)
So the address doesn't change on reboot:
- EC2 → **Elastic IPs** → **Allocate** → then **Associate** it with your instance.
- Note this IP — it's your site address for now. Call it `EC2_IP` below.

## Step 3 — Upload the project
From **your PC**, in the folder that *contains* the `resort` project
(`C:\Users\Arvind Siva\Downloads\Projects`), open **Git Bash** and run:

```bash
# Create an archive that excludes bulky/generated folders AND secrets
# (.env, tunnel notes) — those are generated fresh on the server.
tar --exclude=node_modules --exclude=.git --exclude=dist \
    --exclude=api/node_modules --exclude=api/dist --exclude=api/prisma/dev.db \
    --exclude=.env --exclude=api/.env --exclude=.env.* \
    --exclude=ngrok.txt --exclude=WEBSITE-LINK.txt --exclude=resort.tgz \
    --exclude=*.tsbuildinfo \
    -czf resort.tgz resort

# Verify no secrets slipped in before copying:
tar -tzf resort.tgz | grep -iE '(^|/)\.env' && echo "STOP - .env in archive!" || echo "clean"

# Copy it to the server (adjust path to your .pem and your EC2_IP)
scp -i /path/to/shraddha-key.pem resort.tgz ubuntu@EC2_IP:~/
```

> A fresh database is seeded on the server (including your full food menu), so we
> deliberately skip uploading the local `dev.db`. If you instead want to keep the
> exact data from your PC, remove `--exclude=api/prisma/dev.db` from the `tar`.

## Step 4 — Connect and run setup
```bash
ssh -i /path/to/shraddha-key.pem ubuntu@EC2_IP

# On the server:
tar -xzf resort.tgz
cd resort/deploy
chmod +x setup.sh update.sh
./setup.sh
```
`setup.sh` installs Node, Nginx and PM2, builds the site and API, generates
secure secrets, seeds the database, and wires up Nginx. Takes a few minutes.

## Step 5 — Verify
Open **`http://EC2_IP`** in a browser — the site should load.
- Menu: `http://EC2_IP/dining`
- Admin: `http://EC2_IP/admin` → login `admin@shraddhagarden.com` with the
  randomly generated password printed at the end of `setup.sh` (first run only).

---

## Step 6 — Secure it (do this right away)
1. **Change the admin password** from the admin portal (Users & Staff), and/or
   edit `api/.env` `SEED_ADMIN_PASSWORD` before first run.
2. The JWT secrets were auto-generated — nothing to do.
3. **HTTP is not encrypted.** Admin passwords travel in the clear on `http://`.
   Add HTTPS as soon as you can (next section).
4. Point `PUBLIC_URL` in `api/.env` at the public HTTPS origin once it exists
   (used in email links), then `pm2 restart resort-api`.

## Step 7 — Add a domain + HTTPS (when ready)
Once you have a domain (e.g. from Route 53 or any registrar):
1. Create an **A record** pointing your domain → `EC2_IP`.
2. On the server:
   ```bash
   sudo snap install --classic certbot
   sudo ln -sf /snap/bin/certbot /usr/bin/certbot
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   Certbot edits the Nginx config and auto-renews. Done — `https://` works.

> **No domain but still want HTTPS?** You can use a free wildcard-DNS host like
> `nip.io`: your address becomes `http://EC2_IP.nip.io`, and
> `sudo certbot --nginx -d EC2_IP.nip.io` will issue a real certificate for it.

---

## Day-to-day operations

| Task | Command (on the server) |
|------|-------------------------|
| Deploy new code | re-upload (Step 3) then `cd ~/resort/deploy && ./update.sh` |
| View API logs | `pm2 logs resort-api` |
| Restart API | `pm2 restart resort-api` |
| API status | `pm2 status` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Nginx errors | `sudo tail -f /var/log/nginx/error.log` |

### Back up the database
The whole database is one file: `~/resort/api/prisma/dev.db`. Back it up regularly:
```bash
# manual copy
cp ~/resort/api/prisma/dev.db ~/backup-$(date +%F).db

# or a daily cron backup (keeps it simple)
( crontab -l 2>/dev/null; echo "0 2 * * * cp ~/resort/api/prisma/dev.db ~/db-backup-\$(date +\%F).db" ) | crontab -
```
For real safety, periodically copy those backups off the server (e.g. to S3).

---

## Troubleshooting
- **Site doesn't load:** check the Security Group allows port 80; `sudo nginx -t`
  then `sudo systemctl status nginx`.
- **Site loads but data/menu is empty / errors:** the API may be down —
  `pm2 status`, `pm2 logs resort-api`.
- **Build killed on a `t2.micro`:** it ran out of RAM. `setup.sh` adds 2 GB swap
  automatically; if you removed it, re-run setup or use a `t3.small`.
- **502 Bad Gateway:** API not listening on 4000 — `pm2 restart resort-api`.

---

## When you outgrow one server
SQLite + one EC2 is great for a single small server. If you later need
zero-downtime deploys, autoscaling, or multiple app servers, the next step is:
frontend on **S3 + CloudFront**, API on **App Runner/ECS**, and migrate the DB to
**RDS Postgres** (a Prisma `provider` change + `prisma migrate`). Ask and I'll
prepare that path.

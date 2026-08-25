# Shraddha Garden Resort

> _A sanctuary of celebration and stays_

A production-quality, fully responsive platform for a luxury garden resort:

- a **public marketing site** built pixel-faithfully to the provided designs and
  extended with cohesive in-style pages,
- a role-based **admin portal** (`/admin`) for managing bookings, stays and
  enquiries, sharing the same design language, and
- an **Express + Prisma + SQLite API** with JWT auth, refresh-token rotation and
  RBAC.

**Frontend:** React 18 + Vite + TypeScript · React Router v6 · Tailwind CSS v4
(`@theme` tokens) · Framer Motion · TanStack Query + Table · React Hook Form +
Zod · Recharts.
**Backend:** Node + Express · Prisma · SQLite (zero external setup) · JWT ·
bcrypt · Zod.

---

## Repository layout

```
resort/
  src/          Frontend — public site (src/pages, src/components) + admin
                portal (src/admin/**)
  api/          Backend — Express + Prisma + SQLite
```

Both are run independently in two terminals during development.

---

## Quick start

> **Windows / PowerShell note:** PowerShell 5.1 does not support `&&` as a
> command separator. Run each command on its own line (as below), or join them
> with `;`. The commands themselves are identical across shells.

**1. Backend** (terminal A):

```bash
cd api
cp .env.example .env      # SQLite needs no further setup
npm install
npm run setup             # prisma generate + db push + seed (run once)
npm run dev               # API on http://localhost:4000
```

**2. Frontend** (terminal B, from the repo root):

```bash
cp .env.example .env      # points the app at http://localhost:4000
npm install
npm run dev               # site on http://localhost:5173 (or next free port)
npm run build             # type-check (tsc -b) + production build to /dist
npm run lint              # type-check only (tsc -b)
```

Requires Node 20.6+ (developed on Node 22 — the API uses `process.loadEnvFile`).
Node 22 LTS recommended; the deploy script installs it.

### Troubleshooting

- **`EPERM: operation not permitted, rename …query_engine-windows.dll.node`** on
  `npm run setup` — a running API/`node` process has Prisma's engine DLL locked.
  Stop the API (Ctrl-C in its terminal, or `Get-Process node | Stop-Process
  -Force`), then re-run. `setup` only needs to be run once; day-to-day you just
  need `npm run dev`.
- **`EADDRINUSE :::4000`** (API) or **"Port 5173 is in use"** (web) — an earlier
  instance is still running. Stop it, or let Vite pick the next free port. Find
  the holder with `Get-NetTCPConnection -LocalPort 4000 -State Listen`.

### Admin demo accounts (dev only)

Seeded by `api/prisma/seed.ts` when `SEED_DEMO_ACCOUNTS` is not disabled AND
`NODE_ENV` is not `production` (set `SEED_DEMO_ACCOUNTS=false` in prod). Sign in
at **`/admin/login`**:

| Role        | Email                            | Password              | Can…                                            |
| ----------- | -------------------------------- | --------------------- | ----------------------------------------------- |
| Super Admin | `admin@shraddhagarden.com`       | (env `SEED_ADMIN_PASSWORD`) | everything, incl. delete stays        |
| Manager     | `manager@shraddhagarden.com`     | `Manager@123456`      | CRUD stays, bookings, payments, enquiries        |
| Front Desk  | `frontdesk@shraddhagarden.com`   | `Frontdesk@123456`    | view bookings, change booking status, enquiries |

---

## Route map

| Path                  | Page            | Source design        | Notes                                        |
| --------------------- | --------------- | -------------------- | -------------------------------------------- |
| `/`                   | Home            | `home.png`           | Hero, tradition band, "Sixteen ways", steps, dining |
| `/about`              | About Us        | `about us.png`       | Overlapping photos, stats, on-site list, team |
| `/amenities`          | Amenities list  | `Amenities.png`      | Filter tabs, 16-item grid, alternating features |
| `/amenities/:slug`    | Amenity detail  | `Amenities-detail.png` | Gallery, "What to expect", Quick Facts sidebar |
| `/stays`              | Stays list      | `stays.png`          | Sort dropdown, stay cards                     |
| `/stays/:slug`        | Stay detail     | `stays-detail.png`   | Gallery, amenities, accordions, sticky booking widget |
| `/dining`             | Dining          | _designed in-style_  | Cuisines, signature spreads (API), chef note  |
| `/events`             | Events          | _designed in-style_  | Image hero, event types (API), gallery, steps |
| `/offers`             | Offers/Packages | _designed in-style_  | Promo packages (API content `OFFER`)          |
| `/reserve` · `/enquiry` | Reserve/Enquiry | _designed in-style_ | Enquiry form → `POST /api/enquiries`          |
| `/book`               | Booking flow    | _designed in-style_  | **Multi-step**: dates → availability → add-ons → details + coupon → review (GST breakdown) → confirmation |
| `/signin`             | Sign in / up    | _designed in-style_  | Customer auth (email + password)              |
| `/account`            | My account      | _designed in-style_  | Profile + **My Bookings** (matched by email)  |
| `*`                   | 404             | _designed in-style_  | On-theme not-found page                       |

The public **Stays, Amenities, Dining, Events and Offers** pages are now
**data-driven from the API** (React Query), with loading / empty / error states.
The home **announcement bar** is driven by `ANNOUNCEMENT` banners and is
dismissible. Unknown slugs render the 404 page.

**Customer demo account:** `guest@example.com` / `Guest@123456` (or sign up for a
new one at `/signin`).

### Admin portal (`/admin`)

The admin area has its own chrome (sidebar + topbar, no public header/footer)
and is gated by `ProtectedRoute` — unauthenticated users are redirected to the
login, and a non-admin role can never reach it.

| Path                | Page       | Notes                                                            |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| `/admin/login`      | Sign in    | JWT login; demo-account quick-fill buttons                       |
| `/admin`            | Dashboard  | KPI cards + Recharts (revenue / bookings-by-status)              |
| `/admin/bookings`   | Bookings   | TanStack Table, search + status filter + pagination, detail drawer with the **booking status state machine** and payment actions |
| `/admin/availability` | Availability & Pricing | Availability checker, seasonal/dynamic **rate rules** (FIXED/PERCENT/DELTA, min-stay, priority), blocked dates |
| `/admin/stays`      | Stays      | Card grid + create/edit drawer (RHF + Zod); delete = Super Admin |
| `/admin/amenities` · `dining` · `events` · `offers` | Content | One reusable CRUD screen per content type |
| `/admin/coupons`    | Coupons    | Promo codes (PERCENT/FLAT, min spend, cap, usage limit, expiry)  |
| `/admin/banners`    | Home & Banners | Announcement bar / hero slides / promo banners, scheduling   |
| `/admin/reviews`    | Reviews    | Moderation queue (approve / reject / reply)                      |
| `/admin/enquiries`  | Enquiries  | Leads inbox with `NEW → CONTACTED → CLOSED`, assignee, convert-to-booking |
| `/admin/media`      | Media      | Image-URL library                                                |
| `/admin/reports`    | Reports    | Revenue / occupancy / source breakdowns + **CSV export**         |
| `/admin/users`      | Users & Staff | List + role-filter; create staff & change roles (Super Admin) |
| `/admin/payments`   | Payments   | Gateway (Mock / **Razorpay**) + test/live, methods, deposit %, cancellation policy. Keys editable by Super Admin only; secrets never returned to the browser |
| `/admin/settings`   | Settings   | GST/tax, contact, check-in/out times                             |
| `/admin/audit`      | Audit Log  | Every admin mutation (Super Admin only)                          |

Every data-driven view has explicit **loading / empty / error** states. Admin
content/availability/banner/coupon screens are **Manager+**; Users/Reports/
Settings/Media are **Manager+**; Audit Log is **Super Admin** only.

---

## API reference

Base URL `http://localhost:4000`. All admin routes require
`Authorization: Bearer <accessToken>`; writes are RBAC-checked.

| Method & path                       | Auth            | Purpose                                  |
| ----------------------------------- | --------------- | ---------------------------------------- |
| `POST /api/auth/login`              | public          | Email + password → access + refresh JWT  |
| `POST /api/auth/refresh`            | public          | Rotate refresh token → new token pair    |
| `POST /api/auth/logout`             | public          | Revoke a refresh token                   |
| `GET  /api/auth/me`                 | any user        | Current user from access token           |
| `GET  /api/stays` · `/:slug`        | public          | List / detail (serialized JSON fields)   |
| `POST/PATCH /api/stays[/:id]`       | Manager+        | Create / update a stay                   |
| `DELETE /api/stays/:id`             | Super Admin     | Delete (blocked if it has bookings)      |
| `GET  /api/bookings` · `/:id`       | any admin role  | Paginated list (filter `q`,`status`,`from`,`to`) / detail |
| `POST /api/bookings`                | any admin role  | Create a booking (computes nights/amount)|
| `PATCH /api/bookings/:id/status`    | any admin role  | Status transition (state-machine guarded)|
| `PATCH /api/bookings/:id/payment`   | Manager+        | Set payment status                       |
| `GET  /api/enquiries`               | any admin role  | Leads list                               |
| `POST /api/enquiries`               | public          | Submit an enquiry (contact / events form)|
| `PATCH /api/enquiries/:id`          | any admin role  | Update status / assignee                 |
| `GET  /api/dashboard/stats`         | any admin role  | KPIs + 6-month revenue + status breakdown|
| `POST /api/auth/register`           | public          | Customer self sign-up → JWT pair         |
| `GET  /api/auth/me/bookings`        | customer        | The signed-in customer's bookings        |
| `POST /api/bookings/public`         | public          | Booking flow create (pricing engine + coupon) |
| `POST /api/availability/check`      | public          | Per-night price + availability quote     |
| `GET/POST/PATCH/DELETE /api/availability/rate-rules` | Manager+ | Seasonal / dynamic rate rules |
| `GET/POST/DELETE /api/availability/blocks` | Manager+ | Blocked date ranges               |
| `GET /api/content/:type[/:slug]`    | public          | Amenities / Dining / Events / Offers     |
| `POST/PATCH/DELETE /api/content`    | Manager+        | Content CRUD                             |
| `POST /api/coupons/validate`        | public          | Validate a code → discount               |
| `GET/POST/PATCH/DELETE /api/coupons`| Manager+        | Coupon CRUD                              |
| `GET /api/banners`                  | public          | Active announcement / hero / promo banners |
| `GET/POST/PATCH/DELETE /api/banners`| Manager+        | Banner CRUD (`/all` for admin list)      |
| `GET /api/reviews` · `POST`         | public          | Approved reviews · submit for moderation |
| `GET /api/reviews/admin` · `PATCH`  | any admin role  | Moderation queue · approve/reject/reply  |
| `GET/POST/PATCH /api/users`         | Manager+ / Super | Users & staff (create/role = Super Admin)|
| `GET /api/settings` · `PUT`         | public / Manager+ | Site config (GST, contact, times)      |
| `GET/POST/DELETE /api/media`        | Manager+        | Media library                            |
| `GET /api/reports/summary`          | Manager+        | Revenue/occupancy/source breakdowns      |
| `GET /api/audit`                    | Super Admin     | Audit log                                |
| `GET /api/payments/public-config`   | public          | Provider + key id + methods (no secrets) |
| `POST /api/payments/order`          | public          | Create a gateway order for a booking     |
| `POST /api/payments/verify`         | public          | Verify a payment → confirm booking (server-side) |
| `POST /api/payments/webhook`        | Razorpay        | HMAC-verified webhook → confirm booking  |
| `GET/PUT /api/payments/config`      | Manager+ / Super | Read / update gateway config (secrets write-only) |
| `POST /api/payments/:bookingId/refund` | Manager+     | Policy-aware refund → cancel booking     |

**Booking status state machine** (enforced on the API and mirrored in the UI):

```
PENDING ──▶ CONFIRMED ──▶ CHECKED_IN ──▶ CHECKED_OUT
   │            │
   └──▶ CANCELLED ◀┘
```

Roles: `SUPER_ADMIN` · `MANAGER` · `FRONT_DESK` · `CUSTOMER`. Access tokens
expire in 15m; the frontend transparently refreshes them once on a 401.

### Payments

The booking flow is **server-authoritative**, like real hotel engines: the
browser never marks a booking paid — the server does, on a verified callback /
webhook.

```
booking (PENDING) → POST /payments/order → gateway order
   → guest pays → POST /payments/verify (HMAC-checked)  ┐
   → Razorpay webhook (HMAC-checked)                    ┘→ booking CONFIRMED + PAID
```

- **Two providers** behind one abstraction (`api/src/payments/`): **`mock`** (the
  default — a fully offline test checkout, no signup) and **`razorpay`** (real
  orders/refunds via REST + HMAC signatures, no SDK dependency).
- **Configure in `/admin/payments`** (Super Admin): provider, test/live, Key ID,
  Key Secret, Webhook Secret, enabled methods, deposit %, and the cancellation
  policy. **Secrets are stored server-side only** and never returned to the
  browser (the public config exposes only the publishable Key ID).
- **Refunds** are **policy-aware**: full refund inside the free-cancellation
  window, otherwise the configured penalty is withheld; issued from the booking
  drawer, which cancels the booking and records a `Payment` row.
- To go live with Razorpay: set provider = `razorpay`, paste your **test** keys
  (`rzp_test_…`), point a webhook at `POST /api/payments/webhook`. Razorpay's
  test mode + test cards exercise the whole flow with no real money.

### Reseeding

```bash
cd api
npm run db:reset       # wipe + recreate + full reseed (stays, bookings, enquiries, users, content, coupons, banners, reviews)
npm run seed:content   # re-seed ONLY content/coupons/banners/reviews (keeps stays/bookings/users)
```

---

## Design system

Tokens are defined once in [`src/index.css`](src/index.css) under `@theme`, so
they're available as Tailwind utilities (`bg-forest`, `text-terracotta`,
`font-serif`, `rounded-card`, …).

- **Colours** — cream `#F4EFE6`, paper `#FBF8F2`, forest `#2E4B2E` /
  forest-deep `#1F3320`, charcoal `#1A1A1A`, ink `#23211C`, muted `#7A766C`,
  terracotta `#A6763F`, line `#E3DCCE`.
- **Type** — Playfair Display (serif display + italic script eyebrows), Inter
  (sans UI/body), both self-hosted via Fontsource. Uppercase tracked labels via
  the `.tag-label` helper; italic terracotta eyebrows via `.eyebrow`.
- **Patterns** — `.container-pad`, `.link-underline`, and a bespoke marquee
  keyframe live alongside the tokens.

---

## Project structure

```
src/
  components/      Public reusable UI (Header, Footer, MarqueeBanner,
                   SectionEyebrow, Button, StayCard, AmenityCard, DiningCard,
                   TeamCard, Accordion, BookingWidget, Gallery, StatsRow,
                   StepsBand, PublicLayout, Icon, Reveal, ...)
  data/            Typed mock content + centralized image URLs
                   (images.ts, stays.ts, amenities.ts, dining.ts, events.ts, ...)
  pages/           One file per public route
  admin/
    auth/          AdminAuthContext (token state, login/logout) + ProtectedRoute
    components/    Admin shell — AdminLayout, Sidebar, Topbar, PageHeader,
                   AdminIcon, ui/ (Badge, AdminButton, Drawer, DataState)
    lib/           apiClient (axios + refresh interceptor), tokenStore,
                   queries (TanStack Query hooks)
    pages/         AdminLogin, Dashboard, Bookings (+ BookingDrawer), Stays
                   (+ StayForm), Enquiries
    types.ts, constants.ts
  index.css        Tailwind v4 import + @theme tokens + base/component layers
  App.tsx          Top-level router: /admin/** (guarded) vs public /*
  main.tsx         Bootstrap — QueryClient + AdminAuth providers + BrowserRouter

api/
  prisma/          schema.prisma (User, Stay, Booking, Enquiry, RefreshToken,
                   AuditLog) + seed.ts
  src/
    routes/        auth, stays, bookings, enquiries, dashboard
    middleware/    auth (requireAuth/requireRole), validate (Zod), error
    auth/tokens.ts JWT sign/verify + refresh expiry
    constants.ts   roles, statuses, booking state machine
    app.ts, server.ts
```

### Swapping imagery

All photography is centralized in [`src/data/images.ts`](src/data/images.ts)
(Unsplash, delivered responsively). Replace a URL there and it updates
everywhere it's used. All content (stays, amenities, dining, events, team) lives
in typed `data/*.ts` files for easy editing.

---

## Accessibility & polish

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `article`, `figure`).
- Descriptive `alt` text on every image; `aria-label`/`aria-expanded` on the
  mobile nav and accordions; visible focus rings.
- Working sticky header (transparent over hero → solid on scroll) and an
  animated mobile hamburger menu with body-scroll lock.
- Scroll-reveal and hover-lift animations that respect
  `prefers-reduced-motion`.
- Fully responsive (mobile / tablet / desktop) on every page.

---

© 2024 Shraddha Garden Resort. Unforgettable Memories.

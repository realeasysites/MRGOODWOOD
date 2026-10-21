# Mr. Goodwood (585) — Website

A website + lead-capture backend for Mr. Goodwood, a custom woodworking and
cabinetry business serving the greater Rochester, NY area.

## What's included

- **Public site** (`public/`) — hero, craftsmanship story, services, a
  signature-work spotlight, a filterable project gallery, service area,
  reviews, social links, and a "Start Your Project" consultation form.
- **Backend API** (`server.js`, `routes/`, `db/`) — Node.js + Express +
  SQLite. Every form submission is saved as a **lead** in a real database,
  not just emailed and forgotten.
- **Admin dashboard** (`/admin`) — password-protected page to view, filter,
  update, and export every lead, plus a CSV export button.
- Optional **email notifications** whenever a new lead comes in (currently
  set to `mrgoodwood585@gmail.com` — see `.env.example`).
- Basic spam protection: a honeypot field + rate limiting on the form.

## Quick start (local)

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
cp .env.example .env
```

Open `.env` and set:
- `ADMIN_USER` / `ADMIN_PASSWORD` — the login for `/admin`.
- `NOTIFY_EMAIL` is already set to `mrgoodwood585@gmail.com`. Leave the SMTP
  fields blank to skip email notifications — leads are always saved to the
  database either way.

Then run it:

```bash
npm start
```

- Website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (browser will prompt for the
  username/password you set in `.env`)

The database is a single file at `db/goodwood.db`, created automatically the
first time the server runs. Back this file up occasionally (or export leads
to CSV from the admin dashboard).

## Editing the content

- **Text, phone number, services, service-area towns**: edit
  `public/index.html` directly — it's plain HTML, all content is inline and
  easy to find.
- **Colors, fonts, spacing, the woodgrain/sawblade textures**:
  `public/css/style.css`. Color variables are defined once at the top under
  `:root`. The wood-grain texture and sawblade motif are both inline SVG
  data URIs (`--tex-grain` / `--tex-sawblade`) — no external image files to
  manage or lose.
- **Photos**: all real photos supplied by the client, organized in
  `public/images/` by subject (kitchens, built-ins, vanities, and
  live-edge/epoxy "signature work" shots, plus a close-up craftsmanship
  detail). Swap any of these for better/newer shots any time by replacing
  the file at the same path and filename. The gallery section (`#work` in
  `index.html`) tags each photo with a `data-category` (`kitchen`,
  `builtin`, `vanity`, `signature`) that drives the filter buttons — keep
  that in sync if you add or re-tag photos. See "Adding photos to the
  Gallery page" below for the full `gallery.html` page.
- **Reviews**: the one real quote used ("Is there anything you can't
  do?!" — Kristen M.) came from a public Facebook comment. The stats (100%
  recommend / 31 FB reviews, 5.0 / 33 Google reviews) are from public
  listings at build time — recheck them before launch in case they've
  moved, and add more real quotes as you collect permission to use them.

### Adding photos to the Gallery page

The full gallery (`public/gallery.html`) is driven entirely by one file,
`public/js/gallery-data.js` — you don't need to touch any HTML to add,
remove, or reorder photos there.

1. Drop the new image into `public/images/` (any descriptive filename works,
   e.g. `kitchen-new-island.jpg`).
2. Open `public/js/gallery-data.js` and add one entry to the `GALLERY_PHOTOS`
   list:
   ```js
   {
     file: "kitchen-new-island.jpg",
     caption: "New kitchen island with waterfall edge",
     alt: "Custom kitchen island with a wood waterfall edge",
     category: "kitchen",
   },
   ```
3. `category` must be one of: `kitchen`, `builtin`, `vanity`, or `signature`
   — that's what the filter buttons on the gallery page use. Save the file
   and reload the page; the new photo appears automatically.

The homepage's "Recent projects" preview (`#work` in `index.html`) is a
separate, smaller hand-picked set and is edited directly in the HTML as
described above — it's meant to stay a short highlight reel, with the
"View Full Gallery" button sending visitors to the complete set.

## Deploying it live

Any Node.js host works. Two straightforward, inexpensive options:

**Render.com** (recommended if you want simplicity)
1. Push this folder to a GitHub repo.
2. Create a new "Web Service" on Render, connect the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add the same environment variables from `.env` in Render's dashboard.
5. Render gives you a free `.onrender.com` URL immediately; connect your own
   domain (e.g. `mrgoodwood585.com`) under Settings → Custom Domain.

**Railway.app** — same idea: connect the repo, set env vars, deploy.

⚠️ Important: `db/goodwood.db` lives on disk. Most hosts' free tiers reset
the disk on redeploy. Once you're live and depending on leads, either (a)
use a host with a persistent disk/volume (Render's paid tier supports
this), or (b) ask to upgrade this to a hosted database (e.g. Postgres) — a
small change from SQLite.

## Buying a domain

Pick something simple and memorable — `mrgoodwood585.com` or
`mrgoodwoodwoodworking.com` are both open as of this build. Any registrar
works (Namecheap, Squarespace Domains, Cloudflare Registrar). Point its DNS
at whichever host you deploy to — they'll each give you exact instructions
once your site is live.

## Security notes

- Change `ADMIN_PASSWORD` from the default before going live.
- Always deploy behind HTTPS (Render/Railway do this automatically) so the
  admin login and customer data aren't sent in plain text.
- The `.env` file and `db/goodwood.db` are already excluded via
  `.gitignore` — never commit either one.

## Project structure

```
mr-goodwood-website/
├── server.js              # Express app entry point
├── package.json
├── .env.example            # copy to .env and fill in
├── db/
│   └── database.js         # SQLite schema + connection
├── lib/
│   ├── adminAuth.js         # HTTP Basic Auth for /admin
│   └── mailer.js            # optional email-on-new-lead
├── routes/
│   ├── quotes.js            # POST /api/quote (public)
│   └── admin.js              # /admin/api/* (protected)
└── public/
    ├── index.html
    ├── gallery.html            # full photo gallery page
    ├── css/style.css
    ├── js/
    │   ├── main.js              # homepage nav/reveal/quote-form behavior
    │   ├── gallery-data.js      # photo list that drives gallery.html
    │   └── gallery.js           # renders + filters + lightbox for gallery.html
    ├── images/                # real client photos, organized by subject
    ├── admin/index.html      # dashboard UI
    └── 404.html
```

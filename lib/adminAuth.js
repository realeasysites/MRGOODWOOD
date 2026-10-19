// lib/adminAuth.js
// Password-only login for the admin dashboard (no username).
// Set ADMIN_PASSWORD in Render. Optional: SESSION_SECRET.
// Signing in sets a signed cookie for 30 days. Changing ADMIN_PASSWORD
// signs everyone out. Visit /admin/logout to sign out.

const crypto = require('crypto');

const SITE_NAME = 'Mr. Goodwood';
const COOKIE = 'admin_session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 1; // keeps whatever password is already set in Render working

function password() {
  const p = process.env.ADMIN_PASSWORD || '';
  return p.length >= MIN_PASSWORD_LENGTH ? p : '';
}

function secret() {
  return crypto.createHash('sha256')
    .update(`${process.env.SESSION_SECRET || ''}|${password()}`)
    .digest();
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(expires) {
  return crypto.createHmac('sha256', secret()).update(String(expires)).digest('hex');
}

function readCookie(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function isAuthed(req) {
  if (!password()) return false;
  const [expires, sig] = readCookie(req).split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

function setCookie(req, res, value, maxAgeMs) {
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
}

// Slow down password guessing: 10 tries per 15 minutes per IP.
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.start > 15 * 60 * 1000) { attempts.set(ip, { start: now, count: 0 }); return false; }
  return a.count >= 10;
}
function recordFailure(ip) {
  const a = attempts.get(ip);
  if (a) a.count += 1;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loginPage(message) {
  const note = message ? `<p class="msg">${escapeHtml(message)}</p>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin Login — ${escapeHtml(SITE_NAME)}</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#16181d; color:#fff; font-family:-apple-system, Segoe UI, Roboto, Arial, sans-serif; }
  .box { width:100%; max-width:340px; margin:16px; padding:32px; background:#22252c; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,.35); }
  h1 { margin:0 0 20px; font-size:1.25rem; text-align:center; }
  label { display:block; margin-bottom:6px; font-size:.85rem; color:#c5c8cf; }
  input { width:100%; box-sizing:border-box; padding:12px; margin-bottom:16px; border:1px solid #3a3e47; border-radius:8px; background:#121418; color:#fff; font-size:1rem; }
  button { width:100%; padding:12px; border:0; border-radius:8px; background:#2f7d4f; color:#fff; font-size:1rem; font-weight:700; cursor:pointer; }
  .msg { margin:0 0 16px; color:#ff8a8a; font-size:.9rem; text-align:center; }
</style>
</head>
<body>
  <form class="box" method="POST" action="/admin/login">
    <h1>${escapeHtml(SITE_NAME)} — Admin</h1>
    ${note}
    <label for="password">Password</label>
    <input type="password" id="password" name="password" autocomplete="current-password" autofocus required>
    <button type="submit">Log In</button>
  </form>
</body>
</html>`;
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return resolve(req.body);
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 10000) req.destroy(); });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(data))));
    req.on('error', () => resolve({}));
  });
}

async function adminAuth(req, res, next) {
  const path = req.path;
  const isApi = req.baseUrl.endsWith('/api');

  if (!isApi && path === '/logout') {
    setCookie(req, res, '', 0);
    return res.redirect('/admin/');
  }

  if (!isApi && path === '/login' && req.method === 'POST') {
    if (!password()) return res.status(503).type('html').send(loginPage('Admin password is not set on the server yet.'));
    if (tooManyAttempts(req.ip)) return res.status(429).type('html').send(loginPage('Too many tries. Wait 15 minutes and try again.'));
    const body = await readBody(req);
    if (safeEqual(body.password || '', password())) {
      const expires = Date.now() + MAX_AGE_MS;
      setCookie(req, res, `${expires}.${sign(expires)}`, MAX_AGE_MS);
      return res.redirect('/admin/');
    }
    recordFailure(req.ip);
    return res.status(401).type('html').send(loginPage('Wrong password. Try again.'));
  }

  if (isAuthed(req)) return next();

  if (isApi) return res.status(401).json({ ok: false, error: 'Not signed in.' });
  const msg = password() ? '' : 'Admin password is not set on the server yet.';
  return res.status(401).type('html').send(loginPage(msg));
}

module.exports = adminAuth;
module.exports.isAuthed = isAuthed;

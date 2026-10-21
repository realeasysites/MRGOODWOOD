// lib/adminAuth.js
// Minimal HTTP Basic Auth for the admin dashboard, using credentials set in
// .env (ADMIN_USER / ADMIN_PASSWORD). No extra dependency required.
// This is intentionally simple — for stronger security later, put the whole
// site behind HTTPS (required) and consider a proper login/session system.

const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function adminAuth(req, res, next) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return res.status(500).send('Admin credentials are not configured on the server. Set ADMIN_USER and ADMIN_PASSWORD in .env.');
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPass = decoded.slice(separatorIndex + 1);

    if (timingSafeEqual(suppliedUser, user) && timingSafeEqual(suppliedPass, pass)) {
      return next();
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Mr. Goodwood Admin"');
  return res.status(401).send('Authentication required.');
}

module.exports = adminAuth;

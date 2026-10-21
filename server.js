// server.js
// Mr. Goodwood (585) Custom Woodworking — website + backend.
// Serves the static site and exposes a small API for quote requests and an
// admin dashboard for managing incoming leads.

require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');

const adminAuth = require('./lib/adminAuth');
const quotesRouter = require('./routes/quotes');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // needed for correct req.ip behind a host's proxy (Render, Railway, etc.)

app.use(helmet({
  contentSecurityPolicy: false, // the public site uses inline styles/scripts kept simple on purpose; tighten this if you add a CSP later
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public site
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Public API
app.use('/api', quotesRouter);

// Admin dashboard (protected)
app.use('/admin/api', adminAuth, adminRouter);
app.use('/admin', adminAuth, express.static(path.join(__dirname, 'public/admin')));

app.get('/healthz', (req, res) => res.json({ ok: true }));

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Mr. Goodwood (585) site running on http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
});

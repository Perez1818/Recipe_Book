/**
 * CR API Entry Point (Express)
 *
 * - Loads env, enables CORS + JSON body parsing, serves /public, /js, /css.
 * - Lightweight request logger (always calls next) with status + latency.
 * - Health checks: GET /health and GET /recipes-debug.
 * - Mounts recipe routes under /recipes (see ./routes/cr.routes).
 * - Starts server on PORT (default 4000).
 */
// cr_entry.js — known-good minimal
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// logger that ALWAYS calls next()
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now()-t}ms`);
  });
  next(); // <-- DO NOT remove this
});

// core middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// static (safe even if folders don’t exist)
app.use(express.static('public'));
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

// quick debug route
app.get('/recipes-debug', (_req, res) => res.json({ ok: true }));

// mount API routes
const recipesRouter = require('./routes/cr.routes'); // adjust if your file name differs
app.use('/recipes', recipesRouter);

// health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

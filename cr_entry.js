// cr_entry.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// allow JSON + CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// serve your static frontend (if you have public/, css/, js/)
app.use(express.static('public'));
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

// mount routes
const recipesRouter = require('./routes/cr.routes');
app.use('/recipes', recipesRouter);

// health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

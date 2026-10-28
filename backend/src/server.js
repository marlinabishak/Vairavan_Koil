const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRoutes = require('./routes');

const app = express();

// Apply secure HTTP headers
app.use(helmet());

// Apply strict CORS in production, fallback to * for local development
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

const https = require('https');

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/my-ip', (req, res) => {
  https.get('https://api.ipify.org?format=json', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => res.type('json').send(data));
  }).on('error', err => res.status(500).json({ error: err.message }));
});

app.get('/my-ip', (req, res) => {
  https.get('https://api.ipify.org?format=json', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => res.type('json').send(data));
  }).on('error', err => res.status(500).json({ error: err.message }));
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Vairavan Kovil API running on port ${PORT}`);
});

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

const net = require('net');
const pool = require('./db/pool');

app.get('/api/diagnose', async (req, res) => {
  const host = (process.env.DB_HOST || '').trim();
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  const result = {
    env: { host, port, user, database },
    tcpPing: null,
    tcpPingDomain: null,
    mysqlQuery: null
  };

  const testTcp = (targetHost) => new Promise((resolve) => {
    const start = Date.now();
    const socket = net.createConnection({ host: targetHost, port, timeout: 5000 });
    socket.on('connect', () => {
      const ms = Date.now() - start;
      socket.destroy();
      resolve({ success: true, ms: `${ms}ms` });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'TCP Socket Timeout (5s)' });
    });
    socket.on('error', (err) => {
      resolve({ success: false, error: err.message, code: err.code });
    });
  });

  result.tcpPing = await testTcp(host);
  result.tcpPingDomain = await testTcp('srv443.hstgr.io');

  try {
    const rows = await pool.query('SELECT 1 as test');
    result.mysqlQuery = { success: true, rows };
  } catch (err) {
    result.mysqlQuery = { success: false, error: err.message, code: err.code };
  }

  res.json(result);
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Vairavan Kovil API running on port ${PORT}`);
});

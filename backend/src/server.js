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

app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Vairavan Kovil API running on port ${PORT}`);
});

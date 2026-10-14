const jwt = require('jsonwebtoken');

// Ensure we have a secret key. In production, this MUST be in .env
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token is normally sent as "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    // Attach user payload to request for downstream controllers
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;

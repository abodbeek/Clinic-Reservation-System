const jwt = require('jsonwebtoken');
const pool = require('../Config/db');

// Both identity AND current role come from PostgreSQL, not a stale JWT role.
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) {
    return res.status(401).json({ message: 'Bearer token required' });
  }

  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    if (!decoded.sub || !/^[1-9]\d*$/.test(String(decoded.sub))) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const result = await pool.query(
      'SELECT id, full_name, email, role FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    const user = result.rows[0];
    req.user = { sub: String(user.id), role: user.role, email: user.email, full_name: user.full_name };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('Auth error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = protect;

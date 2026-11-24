require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Authentication middleware.
 * Extracts Bearer token, verifies JWT, confirms user exists and is active,
 * and attaches user details to req.user.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ status: 'error', message: 'Token expired' });
      }
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    // Verify user still exists and is active using parameterized query
    const result = await query(
      'SELECT id, email, role, full_name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Account is inactive' });
    }

    req.user = {
      id: user.id, // BIGINT returned as string by pg; kept as string to avoid precision loss
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      is_active: user.is_active,
    };

    next();
  } catch (error) {
    // Do not expose internal error details
    return res.status(500).json({ status: 'error', message: 'Authentication failed' });
  }
};

module.exports = { authenticateToken };
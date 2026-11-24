const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const BCRYPT_SALT_ROUNDS = 12;
const BCRYPT_MAX_BYTES = 72;

/**
 * User registration.
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'full_name, email, and password are required' });
    }

    // Validate full_name is a non-empty string (reject whitespace-only)
    if (typeof full_name !== 'string' || full_name.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'full_name must be a non-empty string' });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ status: 'error', message: 'Invalid email format' });
    }

    // Validate password is a string and meets length requirements
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters' });
    }

    // Enforce bcrypt 72-byte input limit
    if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
      return res.status(400).json({ status: 'error', message: 'Password exceeds maximum allowed length' });
    }

    // Hash password with bcrypt (12 salt rounds)
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Insert user. Role defaults to 'user' via database constraint.
    // Public registration can never be admin.
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, role, full_name, is_active, created_at`,
      [normalizedEmail, passwordHash, String(full_name).trim()]
    );

    const user = result.rows[0];

    // Generate JWT with explicit HS256 algorithm
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          is_active: user.is_active,
        },
        token,
      },
    });
  } catch (error) {
    // Handle PostgreSQL unique constraint violation on email
    if (error.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    // Do not expose internal error details
    return res.status(500).json({ status: 'error', message: 'Registration failed' });
  }
};

/**
 * User login.
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user using parameterized query (prevents SQL injection)
    const result = await query(
      'SELECT id, email, password_hash, role, full_name, is_active FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Generic error for invalid credentials (prevents email enumeration)
    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Reject inactive accounts
    if (!user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Account is inactive' });
    }

    // Verify password using bcrypt.compare()
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Generate JWT with explicit HS256 algorithm and expiration
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          is_active: user.is_active,
        },
        token,
      },
    });
  } catch (error) {
    // Do not expose internal error details
    return res.status(500).json({ status: 'error', message: 'Login failed' });
  }
};

/**
 * Get current user profile.
 * GET /api/auth/me (protected)
 */
const getMe = async (req, res) => {
  // req.user is populated by authenticateToken middleware
  return res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

module.exports = { register, login, getMe };
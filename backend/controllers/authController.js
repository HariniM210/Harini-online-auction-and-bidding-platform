
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const BCRYPT_SALT_ROUNDS = 12;
const BCRYPT_MAX_BYTES = 72;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\+91[6-9][0-9]{9}$/;

/**
 * User registration.
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      mobile_number,
      password
    } = req.body || {};

    // Validate required fields
    if (!full_name || !email || !mobile_number || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name, email, mobile number and password are required'
      });
    }

    // Validate full name
    if (
      typeof full_name !== 'string' ||
      full_name.trim().length === 0 ||
      full_name.trim().length > 255
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid full name'
      });
    }

    // Validate email type
    if (typeof email !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email address'
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (
      !EMAIL_REGEX.test(normalizedEmail) ||
      normalizedEmail.length > 255
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Validate mobile number type
    if (typeof mobile_number !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number must be a string'
      });
    }

    // Normalize mobile number
    const normalizedMobile = mobile_number.trim();

    // Validate Indian mobile number with +91
    if (!MOBILE_REGEX.test(normalizedMobile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid Indian mobile number with +91 country code'
      });
    }

    // Validate password
    if (
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters'
      });
    }

    // Enforce bcrypt input limit
    if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
      return res.status(400).json({
        status: 'error',
        message: 'Password exceeds maximum allowed length'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      BCRYPT_SALT_ROUNDS
    );

    // Insert user with mobile number.
    // Public registration always creates a normal user.
    const result = await query(
      `INSERT INTO users (
        email,
        password_hash,
        full_name,
        mobile_number,
        role
      )
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING
        id,
        email,
        role,
        full_name,
        mobile_number,
        is_active,
        created_at`,
      [
        normalizedEmail,
        passwordHash,
        full_name.trim(),
        normalizedMobile
      ]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
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
          mobile_number: user.mobile_number,
          is_active: user.is_active,
          created_at: user.created_at
        },
        token
      }
    });

  } catch (error) {

    // Handle duplicate email
    if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Do not expose internal error details
    return res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    });
  }
};

/**
 * User login.
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate required fields and types
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !EMAIL_REGEX.test(normalizedEmail) ||
      normalizedEmail.length > 255
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Retrieve user including mobile number
    const result = await query(
      `SELECT
        id,
        email,
        password_hash,
        role,
        full_name,
        mobile_number,
        is_active,
        created_at
      FROM users
      WHERE email = $1`,
      [normalizedEmail]
    );

    // Check whether user exists
    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Reject inactive accounts
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is inactive'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
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
          mobile_number: user.mobile_number,
          is_active: user.is_active,
          created_at: user.created_at
        },
        token
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
};

/**
 * Get current user profile.
 * GET /api/auth/me (protected)
 */
const getMe = async (req, res) => {
  try {
    // Retrieve current authenticated user
    const result = await query(
      `SELECT
        id,
        email,
        role,
        full_name,
        mobile_number,
        is_active,
        created_at
      FROM users
      WHERE id = $1`,
      [req.user.id]
    );

    if (
      result.rows.length === 0 ||
      !result.rows[0].is_active
    ) {
      return res.status(401).json({
        status: 'error',
        message: 'User account is unavailable'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user profile'
    });
  }
};

module.exports = { register, login, getMe };

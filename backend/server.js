require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Fail safely if required JWT configuration is missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health/db', async (req, res, next) => {
  try {
    await testConnection();
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

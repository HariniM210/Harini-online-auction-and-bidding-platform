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
app.use('/uploads', express.static(require('node:path').join(__dirname,'uploads'), {setHeaders: res => res.setHeader('X-Content-Type-Options','nosniff'), index:false}));
app.use('/api/seller/auctions', require('./routes/sellerRoutes'));
app.post('/api/payments/webhook', express.raw({type:'application/json',limit:'256kb'}), require('./controllers/paymentController').webhook);
app.use(express.json());
app.use('/api/payments',require('./routes/paymentRoutes'));

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', userRoutes);
app.use('/api', require('./routes/browseRoutes'));

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
  if (err.type === 'entity.too.large') return res.status(413).json({status:'error',message:'Image is too large'});
  console.error('Server error:', err.message);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

const {finalize}=require('./controllers/biddingController');
let finalizing=false;
async function settle(){if(finalizing)return;finalizing=true;try{await finalize()}catch(e){console.error('Auction finalizer:',e.message)}finally{finalizing=false}}
app.listen(PORT, () => {
  settle();
  setInterval(settle,5000).unref();
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

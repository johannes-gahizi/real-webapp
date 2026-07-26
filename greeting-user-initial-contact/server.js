const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const config = require('./config');
const { initializeDatabase } = require('./services/dbService');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_URL.includes('render.com') || config.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL');
  }
});

app.use((req, res, next) => {
  req.pool = pool;
  next();
});

initializeDatabase(pool).catch((err) => {
  console.error('Failed to initialize database:', err);
});

setInterval(async () => {
  try {
    await pool.query(`
      UPDATE bookings
      SET payment_status = 'EXPIRED'
      WHERE payment_status = 'PROCESSING'
        AND created_at < NOW() - INTERVAL '10 minutes'
    `);
  } catch (err) {
    console.error('❌ Failed to expire old payments:', err);
  }
}, 60000);

app.use('/api', authRoutes);
app.use('/api', bookingRoutes);
app.use(errorHandler);

const PORT = config.PORT;
app.listen(PORT, () => console.log(`🚀 Gerayo Server live on port ${PORT}`));

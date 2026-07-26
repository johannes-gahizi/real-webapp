const { hashPassword } = require('../server-utils');

async function hashPlainCompanyPasswords(pool) {
  const result = await pool.query(
    "SELECT id, password FROM companies WHERE password IS NOT NULL AND password NOT LIKE 'pbkdf2$%'"
  );

  for (const row of result.rows) {
    await pool.query(
      'UPDATE companies SET password = $1 WHERE id = $2',
      [hashPassword(row.password), row.id]
    );
  }
}

async function initializeDatabase(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullname TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS buses (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        from_city TEXT NOT NULL,
        to_city TEXT NOT NULL,
        time TEXT NOT NULL,
        price INTEGER NOT NULL,
        total_seats INTEGER DEFAULT 30
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        bus_id INTEGER REFERENCES buses(id),
        company_id INTEGER REFERENCES companies(id),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        payment_status TEXT DEFAULT 'PENDING',
        payment_reference TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        seat_number INTEGER
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP
      );
    `);

    await pool.query('ALTER TABLE buses ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 30;');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'PENDING\';');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT \'PENDING\';');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT;');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seat_number INTEGER;');

    const companies = [
      { name: 'Ritco', username: 'ritco', password: '1234' },
      { name: 'Volcano Express', username: 'volcano', password: '1234' }
    ];

    for (const company of companies) {
      await pool.query(
        'INSERT INTO companies (name, username, password) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [company.name, company.username, hashPassword(company.password)]
      );
    }

    const defaultBuses = [
      ['Ritco', 'Kigali', 'Musanze', '08:00', 2500],
      ['Ritco', 'Kigali', 'Rubavu', '11:00', 4000],
      ['Volcano Express', 'Kigali', 'Huye', '09:30', 3000],
      ['Volcano Express', 'Musanze', 'Kigali', '15:00', 2800]
    ];

    for (const [companyName, fromCity, toCity, time, price] of defaultBuses) {
      await pool.query(`
        INSERT INTO buses (company_id, from_city, to_city, time, price, total_seats)
        SELECT c.id, $1, $2, $3, $4, 30
        FROM companies c
        WHERE c.name = $5
          AND NOT EXISTS (
            SELECT 1 FROM buses b
            WHERE b.company_id = c.id
              AND LOWER(b.from_city) = LOWER($1)
              AND LOWER(b.to_city) = LOWER($2)
              AND b.time = $3
          )
      `, [fromCity, toCity, time, price, companyName]);
    }

    await hashPlainCompanyPasswords(pool);
    console.log('🚀 Database Schema Verified.');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    throw err;
  }
}

module.exports = {
  initializeDatabase,
  hashPlainCompanyPasswords
};

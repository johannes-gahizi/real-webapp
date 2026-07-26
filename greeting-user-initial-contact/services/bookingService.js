const logger = require('./logger');

async function searchBuses(pool, from, to) {
  const result = await pool.query(
    `SELECT b.id, b.company_id, b.price, b.time, b.from_city, b.to_city, COALESCE(b.total_seats, 30) AS total_seats,
            c.name AS company,
            (COALESCE(b.total_seats, 30) - (SELECT COUNT(*) FROM bookings bk WHERE bk.bus_id = b.id AND bk.status = 'PAID')) AS seats_left
       FROM buses b
       JOIN companies c ON b.company_id = c.id
       WHERE LOWER(b.from_city) = LOWER($1) AND LOWER(b.to_city) = LOWER($2)`,
    [from, to]
  );
  return result.rows;
}

async function createBooking(pool, busId, name, phone, companyId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const busResult = await client.query(
      'SELECT id, company_id, COALESCE(total_seats, 30) AS total_seats FROM buses WHERE id = $1 FOR UPDATE',
      [busId]
    );

    if (busResult.rows.length === 0) {
      const error = new Error('Bus not found');
      error.status = 404;
      throw error;
    }

    const capacity = parseInt(busResult.rows[0].total_seats, 10) || 30;
    const countResult = await client.query(
      'SELECT COUNT(*) FROM bookings WHERE bus_id = $1 AND status = $2',
      [busId, 'PAID']
    );

    const booked = parseInt(countResult.rows[0].count, 10);
    if (booked >= capacity) {
      const error = new Error('Bus is full');
      error.status = 400;
      throw error;
    }

    const seatNumber = booked + 1;
    const bookingCompanyId = companyId || busResult.rows[0].company_id;

    const result = await client.query(
      `INSERT INTO bookings (bus_id, company_id, name, phone, seat_number, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', 'PENDING') RETURNING id`,
      [busId, bookingCompanyId, name, phone, seatNumber]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getBookingDetails(pool, bookingId) {
  const result = await pool.query(
    `SELECT b.*, bs.price, bs.time, bs.from_city, bs.to_city, c.name AS company_name
       FROM bookings b
       LEFT JOIN buses bs ON b.bus_id = bs.id
       LEFT JOIN companies c ON b.company_id = c.id
       WHERE b.id = $1`,
    [bookingId]
  );

  return result.rows[0] || null;
}

async function createPaymentRequest(pool, bookingId, paymentReference) {
  await pool.query(
    'UPDATE bookings SET payment_status = $1, payment_reference = $2 WHERE id = $3',
    ['PROCESSING', paymentReference, bookingId]
  );
}

async function updateBookingPaymentStatus(pool, bookingId, paymentStatus, status) {
  await pool.query(
    'UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3',
    [paymentStatus, status, bookingId]
  );
}

async function payBooking(pool, bookingId, paymentReference) {
  const result = await pool.query(
    'UPDATE bookings SET status = $1, payment_status = $1, payment_reference = COALESCE($2, payment_reference) WHERE id = $3 RETURNING *',
    ['PAID', paymentReference, bookingId]
  );
  return result.rows[0] || null;
}

async function getCompanyBookings(pool, companyId) {
  const result = await pool.query(
    'SELECT b.*, bs.time, bs.from_city, bs.to_city FROM bookings b JOIN buses bs ON b.bus_id = bs.id WHERE b.company_id = $1 ORDER BY b.created_at DESC',
    [companyId]
  );
  return result.rows;
}

async function getCompanyBuses(pool, companyId) {
  const result = await pool.query(
    'SELECT * FROM buses WHERE company_id = $1 ORDER BY id DESC',
    [companyId]
  );
  return result.rows;
}

async function addBus(pool, companyId, from, to, time, price) {
  const result = await pool.query(
    'INSERT INTO buses (company_id, from_city, to_city, time, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [companyId, from, to, time, price]
  );
  return result.rows[0];
}

module.exports = {
  searchBuses,
  createBooking,
  getBookingDetails,
  createPaymentRequest,
  updateBookingPaymentStatus,
  payBooking,
  getCompanyBookings,
  getCompanyBuses,
  addBus
};

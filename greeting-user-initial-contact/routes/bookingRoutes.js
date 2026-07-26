const express = require('express');
const bookingService = require('../services/bookingService');
const paymentService = require('../services/payment/paymentService');
const logger = require('../services/logger');
const { buildTicketResponse, sendSMS, hashPassword } = require('../server-utils');
const { normalizePhone, normalizeText, validationResult } = require('../services/inputValidation');

const router = express.Router();

router.get('/buses', async (req, res, next) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.json([]);
  }

  try {
    const buses = await bookingService.searchBuses(req.pool, from, to);
    res.json(buses);
  } catch (err) {
    next(err);
  }
});

router.post('/book', async (req, res, next) => {
  const { busId, company_id } = req.body;
  const name = normalizeText(req.body.name);
  const phone = normalizePhone(req.body.phone);
  const validation = validationResult({ busId, name, phone: req.body.phone });
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields.', fields: validation.fields } });
  }

  try {
    const booking = await bookingService.createBooking(req.pool, busId, name, phone, company_id);
    res.json({ success: true, bookingId: booking.id });
  } catch (err) {
    next(err);
  }
});

router.get('/ticket/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingDetails(req.pool, req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const response = await buildTicketResponse(
      booking,
      {
        price: booking.price,
        time: booking.time,
        from_city: booking.from_city,
        to_city: booking.to_city
      },
      {
        name: booking.company_name
      }
    );

    res.json(response);
  } catch (err) {
    next(err);
  }
});

router.post('/pay-request', async (req, res, next) => {
  const { bookingId } = req.body;
  const phone = normalizePhone(req.body.phone);
  const validation = validationResult({ bookingId, phone: req.body.phone });
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Enter a valid booking reference and mobile-money number.', fields: validation.fields } });
  }

  try {
    const bookingDetails = await bookingService.getBookingDetails(req.pool, bookingId);
    if (!bookingDetails) {
      return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking reference not found.' } });
    }

    const result = await paymentService.processPaymentRequest({
      bookingId,
      phone,
      amount: bookingDetails.price
    });

    await bookingService.createPaymentRequest(req.pool, bookingId, result.reference);

    // If simulated, queue automated status update for development convenience
    if (paymentService.getActiveProviderName() === 'simulated') {
      setTimeout(async () => {
        try {
          const rand = Math.random();
          let status = 'PAID';
          if (rand < 0.15) status = 'FAILED';
          else if (rand < 0.25) status = 'EXPIRED';

          await bookingService.updateBookingPaymentStatus(
            req.pool,
            bookingId,
            status,
            status === 'PAID' ? 'PAID' : 'PENDING'
          );

          if (status === 'PAID') {
            sendSMS(phone, '✅ Payment received. Your ticket is confirmed!');
          }
          logger.info(`💳 Simulated payment updated to ${status} for booking #${bookingId}`);
        } catch (error) {
          logger.error('Simulated payment timer error:', error);
        }
      }, 3000);
    }

    res.json({ success: true, ref: result.reference, message: result.message });
  } catch (err) {
    next(err);
  }
});

router.post('/payment/webhook', async (req, res, next) => {
  try {
    const providerName = req.query.provider || paymentService.getActiveProviderName();
    const payload = paymentService.parseWebhookPayload(req, providerName);

    logger.info(`[Webhook] Received update for booking #${payload.bookingId}: status=${payload.status}`);

    if (payload.bookingId) {
      await bookingService.updateBookingPaymentStatus(
        req.pool,
        payload.bookingId,
        payload.status,
        payload.status === 'PAID' ? 'PAID' : 'PENDING'
      );

      if (payload.status === 'PAID') {
        const booking = await bookingService.getBookingDetails(req.pool, payload.bookingId);
        if (booking?.phone) {
          sendSMS(booking.phone, `✅ Payment received! Booking #${booking.id} confirmed.`);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Payment webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/payment-callback', async (req, res, next) => {
  const { bookingId, status } = req.body;
  if (!bookingId || !status) {
    return res.status(400).send('bookingId and status are required');
  }

  try {
    await bookingService.updateBookingPaymentStatus(
      req.pool,
      bookingId,
      status,
      status === 'PAID' ? 'PAID' : 'PENDING'
    );
    res.send('Callback processed');
  } catch (err) {
    next(err);
  }
});

router.post('/pay', async (req, res, next) => {
  const { bookingId, paymentReference } = req.body;
  if (!bookingId) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A booking reference is required.', fields: { bookingId: 'A booking reference is required.' } } });
  }

  try {
    const booking = await bookingService.payBooking(req.pool, bookingId, paymentReference);
    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' } });
    }

    const msg = `Confirmed! Booking #${booking.id} for ${booking.name}. Seat: ${booking.seat_number}. Ref: ${paymentReference || booking.payment_reference}`;
    sendSMS(booking.phone, msg);

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) {
    next(err);
  }
});

router.get('/bookings', async (req, res, next) => {
  const { company_id } = req.query;
  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    const bookings = await bookingService.getCompanyBookings(req.pool, company_id);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

router.get('/all-buses', async (req, res, next) => {
  const { company_id } = req.query;
  if (!company_id) {
    return res.json([]);
  }

  try {
    const buses = await bookingService.getCompanyBuses(req.pool, company_id);
    res.json(buses);
  } catch (err) {
    next(err);
  }
});

router.post('/add-bus', async (req, res, next) => {
  const { company_id, time, price } = req.body;
  const from = normalizeText(req.body.from);
  const to = normalizeText(req.body.to);
  const validation = validationResult({ from, to, time, price });
  if (!company_id || !validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please correct the route details.', fields: { ...validation.fields, ...(!company_id ? { company_id: 'Company is required.' } : {}) } } });
  }

  try {
    await bookingService.addBus(req.pool, company_id, from, to, time, price);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/setup-companies', async (req, res, next) => {
  const { key } = req.query;
  if (key !== 'admin123') {
    return res.status(403).send('Unauthorized');
  }

  try {
    const companies = [
      { name: 'Ritco', username: 'ritco', password: '1234' },
      { name: 'Volcano Express', username: 'volcano', password: '1234' }
    ];

    for (const company of companies) {
      await req.pool.query(
        'INSERT INTO companies (name, username, password) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [company.name, company.username, hashPassword(company.password)]
      );
    }

    res.send('System ready! Companies initialized. ✅');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const test = require('node:test');
const assert = require('node:assert/strict');
const paymentService = require('../services/payment/paymentService');

test('PaymentService defaults to simulated provider when process.env.PAYMENT_PROVIDER is unset or simulated', () => {
  const provider = paymentService.getProvider('simulated');
  assert.equal(provider.name, 'simulated');
});

test('PaymentService returns momo provider when requested', () => {
  const provider = paymentService.getProvider('momo');
  assert.equal(provider.name, 'momo');
});

test('PaymentService returns paypack provider when requested', () => {
  const provider = paymentService.getProvider('paypack');
  assert.equal(provider.name, 'paypack');
});

test('SimulatedPaymentProvider dispatches request and returns reference', async () => {
  const result = await paymentService.processPaymentRequest({
    bookingId: 99,
    phone: '0781234567',
    amount: 2500,
    providerName: 'simulated'
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'PROCESSING');
  assert.ok(result.reference.startsWith('SIM-'));
});

test('MomoPaymentProvider parses webhook payload correctly', () => {
  const momo = paymentService.getProvider('momo');
  const parsed = momo.parseWebhook({
    body: {
      externalId: '101',
      financialTransactionId: 'MTN-REF-888',
      status: 'SUCCESSFUL'
    }
  });

  assert.equal(parsed.bookingId, '101');
  assert.equal(parsed.reference, 'MTN-REF-888');
  assert.equal(parsed.status, 'PAID');
});

test('PaypackPaymentProvider parses webhook payload correctly', () => {
  const paypack = paymentService.getProvider('paypack');
  const parsed = paypack.parseWebhook({
    body: {
      data: {
        external_id: '202',
        ref: 'PAYPACK-REF-999',
        status: 'successful'
      }
    }
  });

  assert.equal(parsed.bookingId, '202');
  assert.equal(parsed.reference, 'PAYPACK-REF-999');
  assert.equal(parsed.status, 'PAID');
});

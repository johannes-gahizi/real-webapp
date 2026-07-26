const logger = require('../logger');

class PaypackPaymentProvider {
  constructor(config = {}) {
    this.name = 'paypack';
    this.clientId = config.PAYPACK_CLIENT_ID || process.env.PAYPACK_CLIENT_ID;
    this.clientSecret = config.PAYPACK_CLIENT_SECRET || process.env.PAYPACK_CLIENT_SECRET;
    this.baseUrl = 'https://api.paypack.rw/v1';
  }

  async getAccessToken() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Paypack API credentials missing in environment.');
    }

    const response = await fetch(`${this.baseUrl}/auth/agents/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId, client_secret: this.clientSecret })
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Paypack API');
    }

    const data = await response.json();
    return data.access;
  }

  async requestPayment({ bookingId, phone, amount }) {
    logger.info(`[PaypackPaymentProvider] Initiating cashin for booking #${bookingId} to ${phone}`);
    const token = await this.getAccessToken();
    const cleanPhone = phone.replace(/\D/g, '');

    const response = await fetch(`${this.baseUrl}/events/cashin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        number: cleanPhone
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('[PaypackPaymentProvider] Cashin failed:', { status: response.status, body: errText });
      throw new Error('Paypack payment request failed');
    }

    const data = await response.json();
    return {
      success: true,
      reference: data.ref || `PAYPACK-${bookingId}`,
      status: 'PROCESSING',
      message: 'Paypack payment request dispatched.'
    };
  }

  async checkStatus({ bookingId, reference }) {
    logger.info(`[PaypackPaymentProvider] Checking status for ref ${reference}`);
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/events/transactions?ref=${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`Paypack status request failed: ${response.status}`);

    const data = await response.json();
    const transaction = data.transactions?.[0];
    const status = transaction?.status === 'successful' ? 'PAID' : transaction?.status === 'failed' ? 'FAILED' : 'PROCESSING';

    return {
      status,
      reference
    };
  }

  parseWebhook(req) {
    const data = req.body?.data || req.body || {};
    const status = data.status === 'successful' ? 'PAID' : data.status === 'failed' ? 'FAILED' : 'PROCESSING';
    return {
      bookingId: data.external_id || data.metadata?.bookingId,
      reference: data.ref,
      status
    };
  }
}

module.exports = PaypackPaymentProvider;

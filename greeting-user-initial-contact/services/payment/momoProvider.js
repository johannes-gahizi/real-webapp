const logger = require('../logger');

class MomoPaymentProvider {
  constructor(config = {}) {
    this.name = 'momo';
    this.subscriptionKey = config.MOMO_SUBSCRIPTION_KEY || process.env.MOMO_SUBSCRIPTION_KEY;
    this.targetEnvironment = config.MOMO_ENVIRONMENT || process.env.MOMO_ENVIRONMENT || 'sandbox';
    this.apiUser = config.MOMO_API_USER || process.env.MOMO_API_USER;
    this.apiKey = config.MOMO_API_KEY || process.env.MOMO_API_KEY;
    this.baseUrl = this.targetEnvironment === 'production' 
      ? 'https://proxy.momoapi.mtn.com/collection' 
      : 'https://sandbox.momodeveloper.mtn.com/collection';
  }

  async getAccessToken() {
    if (!this.apiUser || !this.apiKey || !this.subscriptionKey) {
      throw new Error('MTN MoMo API credentials missing in environment.');
    }
    const credentials = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('[MomoPaymentProvider] Token generation failed:', { status: response.status, body: errText });
      throw new Error('Failed to generate MTN MoMo access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  async requestPayment({ bookingId, phone, amount }) {
    logger.info(`[MomoPaymentProvider] Initiating requestToPay for booking #${bookingId} to ${phone}`);
    const token = await this.getAccessToken();
    const reference = `MOMO-${bookingId}-${Date.now()}`;
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '250');

    const payload = {
      amount: String(amount),
      currency: 'RWF',
      externalId: String(bookingId),
      payer: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone
      },
      payerMessage: `Gerayo Bus Booking #${bookingId}`,
      payeeNote: 'Bus Ticket'
    };

    const response = await fetch(`${this.baseUrl}/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': this.targetEnvironment,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status !== 202) {
      const errBody = await response.text();
      logger.error('[MomoPaymentProvider] requestToPay failed:', { status: response.status, body: errBody });
      throw new Error('MTN MoMo requestToPay initiation failed');
    }

    return {
      success: true,
      reference,
      status: 'PROCESSING',
      message: 'MoMo push payment prompt sent to device.'
    };
  }

  async checkStatus({ bookingId, reference }) {
    logger.info(`[MomoPaymentProvider] Checking status for reference ${reference}`);
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1_0/requesttopay/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': this.targetEnvironment,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey
      }
    });

    if (!response.ok) {
      throw new Error(`MoMo status query failed with code ${response.status}`);
    }

    const data = await response.json();
    const momoStatus = data.status; // SUCCESSFUL, FAILED, PENDING
    const mappedStatus = momoStatus === 'SUCCESSFUL' ? 'PAID' : momoStatus === 'FAILED' ? 'FAILED' : 'PROCESSING';

    return {
      status: mappedStatus,
      reference,
      raw: data
    };
  }

  parseWebhook(req) {
    const body = req.body || {};
    const externalId = body.externalId;
    const momoStatus = body.status;
    const mappedStatus = momoStatus === 'SUCCESSFUL' ? 'PAID' : momoStatus === 'FAILED' ? 'FAILED' : 'PROCESSING';

    return {
      bookingId: externalId,
      reference: body.financialTransactionId || body.referenceId,
      status: mappedStatus
    };
  }
}

module.exports = MomoPaymentProvider;

const logger = require('../logger');

class SimulatedPaymentProvider {
  constructor() {
    this.name = 'simulated';
  }

  async requestPayment({ bookingId, phone, amount }) {
    logger.info(`[SimulatedPaymentProvider] Requesting payment for booking #${bookingId} from ${phone} (${amount} RWF)`);
    const reference = `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      success: true,
      reference,
      status: 'PROCESSING',
      message: 'Simulated payment prompt sent to device.'
    };
  }

  async checkStatus({ bookingId, reference }) {
    logger.info(`[SimulatedPaymentProvider] Checking status for booking #${bookingId} (ref: ${reference})`);
    return {
      status: 'PAID',
      reference
    };
  }

  parseWebhook(req) {
    const { bookingId, reference, status } = req.body || {};
    return {
      bookingId,
      reference: reference || `SIM-${Date.now()}`,
      status: status || 'PAID'
    };
  }
}

module.exports = SimulatedPaymentProvider;

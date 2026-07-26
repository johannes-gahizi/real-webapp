const logger = require('../logger');
const SimulatedPaymentProvider = require('./simulatedProvider');
const MomoPaymentProvider = require('./momoProvider');
const PaypackPaymentProvider = require('./paypackProvider');

class PaymentService {
  constructor() {
    this.providers = {
      simulated: new SimulatedPaymentProvider(),
      momo: new MomoPaymentProvider(),
      paypack: new PaypackPaymentProvider()
    };
  }

  getActiveProviderName() {
    const providerName = (process.env.PAYMENT_PROVIDER || 'simulated').toLowerCase();
    return this.providers[providerName] ? providerName : 'simulated';
  }

  getProvider(name) {
    const activeName = name || this.getActiveProviderName();
    const provider = this.providers[activeName];
    if (!provider) {
      logger.warn(`Unknown payment provider '${activeName}', falling back to 'simulated'`);
      return this.providers.simulated;
    }
    return provider;
  }

  async processPaymentRequest({ bookingId, phone, amount, providerName }) {
    const provider = this.getProvider(providerName);
    logger.info(`Processing payment request via provider '${provider.name}' for booking #${bookingId}`);
    return provider.requestPayment({ bookingId, phone, amount });
  }

  async checkPaymentStatus({ bookingId, reference, providerName }) {
    const provider = this.getProvider(providerName);
    return provider.checkStatus({ bookingId, reference });
  }

  parseWebhookPayload(req, providerName) {
    const provider = this.getProvider(providerName);
    return provider.parseWebhook(req);
  }
}

module.exports = new PaymentService();

const logger = require('../services/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled request error:', {
    path: req.originalUrl,
    method: req.method,
    status: err.status || 500,
    message: err.message,
    stack: err.stack
  });

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = status >= 500 ? 'Something went wrong on our side. Please try again.' : (err.message || 'Request could not be completed.');

  res.status(status).json({
    success: false,
    error: {
      code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message,
      ...(err.fields ? { fields: err.fields } : {})
    }
  });
}

module.exports = errorHandler;

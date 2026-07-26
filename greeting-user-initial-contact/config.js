require('dotenv').config();

function getRequiredEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),
  APP_BASE_URL: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  SMTP_HOST: getRequiredEnv('SMTP_HOST'),
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: getRequiredEnv('SMTP_USER'),
  SMTP_PASS: getRequiredEnv('SMTP_PASS'),
  MAIL_FROM: process.env.MAIL_FROM || '"Gerayo" <no-reply@gerayo.app>'
};

module.exports = config;

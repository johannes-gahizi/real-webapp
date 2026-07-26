# Gerayo Production Deployment Guide

This guide details step-by-step instructions for deploying the Gerayo MVP application to production servers (such as Render, Railway, Heroku, or AWS EC2) with live payment integrations and PostgreSQL.

---

## 1. Environment Variable Reference

Set the following variables in your hosting environment settings (e.g. Render Dashboard -> Environment Variables):

| Variable Name | Required | Example / Options | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production optimizations and disables debug verbose output. |
| `PORT` | Yes | `3000` | Port for the Express application server. |
| `DATABASE_URL` | Yes | `postgres://user:pass@host:5432/gerayo_prod` | PostgreSQL database connection string (SSL required for cloud DBs). |
| `JWT_SECRET` | Yes | `super-secret-random-32-char-string` | Secret key for signing passenger session tokens. |
| `PAYMENT_PROVIDER` | Yes | `simulated` \| `momo` \| `paypack` | Active payment gateway module. |
| `MOMO_SUBSCRIPTION_KEY` | Optional | `ee72...` | Primary key for MTN MoMo Developer Portal. |
| `MOMO_ENVIRONMENT` | Optional | `sandbox` \| `production` | Target MTN MoMo API environment. |
| `MOMO_API_USER` | Optional | `uuid-v4-string` | Generated User ID for MTN MoMo Collections API. |
| `MOMO_API_KEY` | Optional | `api-key-string` | Secret API key generated for your User ID. |
| `PAYPACK_CLIENT_ID` | Optional | `client_id_string` | Client ID from Paypack Rwanda Dashboard. |
| `PAYPACK_CLIENT_SECRET` | Optional | `client_secret_string` | Client Secret from Paypack Rwanda. |

---

## 2. Database Provisioning & Security

1. **PostgreSQL Service:** Create a managed PostgreSQL instance (e.g. Render PostgreSQL, Supabase, Neon, or AWS RDS).
2. **SSL Connection:** Ensure database connections specify SSL when connecting remotely:
   - `server.js` automatically enables SSL checking when deployed on non-localhost hosts.
3. **Database Backups:** Enable automated daily backups in your database provider dashboard.

---

## 3. Webhook Configuration (MTN MoMo / Paypack)

When using live payment providers, configure your provider callback URL in your payment dashboard:

- **Webhook URL format:** `https://<YOUR-APP-DOMAIN>/api/payment/webhook`
- **Supported Methods:** `POST`

---

## 4. Production Checklist

- [ ] All sensitive keys (`JWT_SECRET`, DB passwords, payment API keys) set via Environment Variables, NOT hardcoded.
- [ ] `PAYMENT_PROVIDER` set to `momo` or `paypack` for live operations, or `simulated` for staging/demo environments.
- [ ] Database SSL enabled and schema verified (`initializeDatabase` runs automatically on server launch).
- [ ] Test suite verified (`npm test`).
- [ ] HTTPS enabled on host domain (SSL certificate).

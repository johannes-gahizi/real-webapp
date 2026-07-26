# PROJECT_CONTEXT

## 1. Project Name
Gerayo MVP

## 2. Project Description
Gerayo is a web application designed to help Rwandan public transport companies sell bus tickets online. It provides a searchable booking experience for passengers and a dashboard for transport companies to manage routes, bookings, and payments.

## 3. Project Goal
Create a professional, fast, user-friendly, and scalable ticket booking application for Rwandan bus operators. Users should be able to search for trips, book seats, and complete payments online. The system should support growing demand and deliver a clear, attractive interface.

## 4. Technology Stack
- Node.js
- Express
- PostgreSQL
- HTML/CSS/JavaScript static front-end
- Nodemailer for email
- QRCode generation
- dotenv for environment configuration
- body-parser / express.json for request parsing
- cors
- CommonJS module style

## 5. Folder Structure
- `server.js` — main Express server and API routes
- `server-utils.js` — shared utilities for password hashing, email composition, SMS stub, ticket response formatting
- `package.json` — project metadata, scripts, dependencies
- `.env.example` — environment variable template
- `public/` — static front-end pages
  - `index.html`
  - `signup.html`
  - `user-login.html`
  - `search.html`
  - `booking.html`
  - `payment.html`
  - `ticket.html`
  - `reset-password.html`
  - `company-login.html`
  - `admin.html`
- `tests/` — Node.js built-in tests
  - `password-reset.test.js`
  - `ticket-response.test.js`
  - `db-write-check.js`

## 6. Database Tables
Extracted from server initialization logic:

- `companies`
  - `id SERIAL PRIMARY KEY`
  - `name TEXT NOT NULL`
  - `username TEXT UNIQUE NOT NULL`
  - `password TEXT NOT NULL`

- `users`
  - `id SERIAL PRIMARY KEY`
  - `fullname TEXT`
  - `email TEXT UNIQUE NOT NULL`
  - `password TEXT NOT NULL`

- `buses`
  - `id SERIAL PRIMARY KEY`
  - `company_id INTEGER REFERENCES companies(id)`
  - `from_city TEXT NOT NULL`
  - `to_city TEXT NOT NULL`
  - `time TEXT NOT NULL`
  - `price INTEGER NOT NULL`
  - `total_seats INTEGER DEFAULT 30`

- `bookings`
  - `id SERIAL PRIMARY KEY`
  - `bus_id INTEGER REFERENCES buses(id)`
  - `company_id INTEGER REFERENCES companies(id)`
  - `name TEXT NOT NULL`
  - `phone TEXT NOT NULL`
  - `status TEXT DEFAULT 'PENDING'`
  - `payment_status TEXT DEFAULT 'PENDING'`
  - `payment_reference TEXT`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `seat_number INTEGER`

- `password_reset_tokens`
  - `id SERIAL PRIMARY KEY`
  - `email TEXT NOT NULL`
  - `token TEXT UNIQUE NOT NULL`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `expires_at TIMESTAMP NOT NULL`
  - `used_at TIMESTAMP`

## 7. Coding Standards
- CommonJS modules (`require`, `module.exports`)
- Async/await database operations with PostgreSQL
- Environment-driven configuration via `.env`
- Password hashing using PBKDF2
- Input validation in API routes
- Static front-end served from `public/`
- Tests using Node built-in `node:test`

## 8. Current Progress
- Backend server implemented with Express.
- PostgreSQL schema initialization and default seed data created.
- Passenger signup and login APIs are in place.
- Password reset flow implemented with email token generation.
- Search endpoint for available buses is present.
- Booking endpoint with seat availability checks exists.
- Payment simulation endpoints implemented, including `pay-request`, `payment-callback`, and `pay`.
- Ticket lookup endpoint returns QR-enabled ticket details.
- Company/admin login endpoint and dashboard/API for company bookings and bus management implemented.
- Static UI pages exist for booking flow, admin login, and password reset.

## 9. Next Task
Prioritized next work:
- Secure company login and store hashed company passwords.
- Improve front-end user experience and unify the UI flow.
- Add real payment gateway integration with MTN and Airtel mobile money providers, suited for Rwanda.
- Modularize back-end routes/controllers and add proper error handling.
- Add documentation and onboarding files such as README.

## 10. Recent Changes
Visible from current source code:
- SMS confirmation stub added for payment success notifications.
- Ticket response now includes QR code generation.
- Password reset email assembly and sending added.
- Database migration-safe schema initialization expanded.
- Company and bus seed data insertion logic present.

## 11. Architecture
Gerayo uses a simple server-driven architecture:
- Single Express server handles API routes and serves static front-end HTML.
- PostgreSQL stores users, companies, buses, bookings, and password reset tokens.
- Utilities are centralized in `server-utils.js` for hashing, email, and ticket formatting.
- Front-end is static HTML/CSS/JS in `public/`, consuming the REST API.
- Payment flow is simulated with delayed status updates and stub SMS notifications.

## Suggestions Included
The file includes recommendations to:
- Hash company passwords instead of storing plain text.
- Add a proper README and developer onboarding documentation.
- Break routes into separate modules for maintainability.
- Replace static HTML pages with a modern front-end framework for a more polished UX.
- Add production-grade authentication and authorization.
- Integrate MTN and Airtel mobile money payment providers for Rwanda.

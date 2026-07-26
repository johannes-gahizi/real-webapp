# Gerayo MVP — Rwandan Public Transport Booking System

Gerayo is an online ticket booking application designed for Rwandan public bus transportation. It allows passengers to search for available intercity trips, reserve seats, and complete simulated mobile money payments. It also provides transport operators with an admin panel to manage routes, buses, and view bookings.

---

## Technical Stack

- **Backend Runtime:** Node.js (CommonJS)
- **Web Framework:** Express.js
- **Database:** PostgreSQL (with `pg` connection pool)
- **Frontend UI:** HTML5, CSS3 (Vanilla design system in `shared.css`), JavaScript (`shared.js`)
- **Testing:** Node.js built-in test runner (`node --test`)
- **Utilities:** Nodemailer (email notifications), QRCode (digital ticket QR rendering), PBKDF2 (password hashing)

---

## Prerequisites

1. **Node.js** (v18.x or later recommended)
2. **PostgreSQL** database instance running locally or via a hosted service (e.g., Render, Neon, Supabase)

---

## Environment Configuration

Copy `.env.example` to create `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/gerayo_db
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

---

## Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Database & Initialize Schema:**
   The Express server automatically runs database migration scripts and seeds initial transport company data upon launch.

3. **Start Development Server:**
   ```bash
   npm start
   ```
   The application will be accessible at `http://localhost:3000`.

---

## Running Automated Tests

Run the test suite using Node's native test runner:

```bash
npm test
```

Test coverage includes:
- Password hashing & verification (`tests/password-reset.test.js`)
- Ticket API formatting (`tests/ticket-response.test.js`)
- Input validation helpers for email, Rwandan phone, names, and bus IDs (`tests/validation.test.js`)

---

## Core User Flows

### Passenger Flow
1. **Search:** Visit `http://localhost:3000` or `search.html` to select departure and destination cities (e.g., Kigali → Musanze).
2. **Select & Book:** Pick an available bus departure time and enter passenger details.
3. **Payment:** Authorize simulated Mobile Money payment (MTN / Airtel 078/079 format).
4. **Ticket:** Receive a digital ticket featuring passenger details, seat number, and a scannable QR code.

### Transport Operator Flow
1. **Partner Login:** Visit `company-login.html` to log in with transport operator credentials.
2. **Management Dashboard:** Visit `admin.html` to view company bookings, manage bus schedules, create routes, and update seat capacity.

---

## API Documentation

For detailed information on API endpoints, request bodies, and error response schemas, refer to [`docs/API.md`](./docs/API.md).

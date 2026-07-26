# Gerayo API Documentation

Base URL: `http://localhost:3000/api`

All JSON request bodies must send the `Content-Type: application/json` header.

---

## Standard Error Response Format

All API errors return a consistent HTTP status code along with a normalized JSON payload:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the errors in the form.",
    "fields": {
      "email": "Enter a valid email address.",
      "phone": "Use a Rwandan mobile number, for example 078 123 4567."
    }
  }
}
```

---

## 1. Authentication Endpoints

### `POST /api/signup`
Registers a new passenger account.

- **Request Body:**
  ```json
  {
    "fullname": "Jean Doe",
    "email": "jean@example.com",
    "password": "password123"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "token": "jwt_token_string",
    "userName": "Jean Doe"
  }
  ```

### `POST /api/login`
Authenticates a passenger account.

- **Request Body:**
  ```json
  {
    "email": "jean@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "jwt_token_string",
    "userName": "Jean Doe"
  }
  ```

### `POST /api/request-password-reset`
Initiates a password reset process by generating a reset token and sending an email.

- **Request Body:**
  ```json
  {
    "email": "jean@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Reset instructions have been sent to your email."
  }
  ```

### `POST /api/reset-password`
Resets the password using a valid token.

- **Request Body:**
  ```json
  {
    "token": "reset_token_string",
    "newPassword": "newPassword123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password updated successfully."
  }
  ```

---

## 2. Bus & Booking Endpoints

### `GET /api/buses?from=Kigali&to=Musanze`
Searches for available departures between given cities.

- **Query Parameters:**
  - `from` (string, required): Departure city
  - `to` (string, required): Destination city
- **Success Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "company_id": 2,
      "company": "Ritco Express",
      "from_city": "Kigali",
      "to_city": "Musanze",
      "time": "08:00",
      "price": 2500,
      "seats_left": 14
    }
  ]
  ```

### `POST /api/book`
Creates a pending seat booking.

- **Request Body:**
  ```json
  {
    "busId": 1,
    "company_id": 2,
    "name": "Jean Doe",
    "phone": "0781234567"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "bookingId": 42,
    "seatNumber": 7,
    "message": "Booking created. Please authorize payment."
  }
  ```

---

## 3. Simulated Payment Endpoints

### `POST /api/pay-request`
Triggers a simulated Mobile Money USSD payment prompt.

- **Request Body:**
  ```json
  {
    "bookingId": 42,
    "phone": "0781234567"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment prompt sent to mobile device."
  }
  ```
  *(Note: In MVP mode, payment automatically completes within 2–5 seconds)*

### `GET /api/ticket/:bookingId`
Retrieves full ticket details and generated QR code image for a booking.

- **Success Response (200 OK):**
  ```json
  {
    "booking_id": 42,
    "passenger_name": "Jean Doe",
    "phone": "0781234567",
    "company_name": "Ritco Express",
    "from_city": "Kigali",
    "to_city": "Musanze",
    "time": "08:00",
    "price": 2500,
    "seat_number": 7,
    "payment_status": "PAID",
    "payment_reference": "TX-948102",
    "qr_code": "data:image/png;base64,..."
  }
  ```

---

## 4. Transport Company Admin Endpoints

### `POST /api/company/login`
Authenticates a transport partner/company admin.

### `GET /api/company/bookings`
Returns bookings associated with the logged-in company.

### `POST /api/company/buses`
Creates or updates a bus departure route schedule.

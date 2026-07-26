const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RWANDA_LOCAL_PHONE = /^07\d{8}$/;
const RWANDA_INTERNATIONAL_PHONE = /^\+?2507\d{8}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}' -]{1,79}$/u;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value) {
  const compact = normalizeText(value).replace(/[\s-]/g, '');
  if (RWANDA_LOCAL_PHONE.test(compact)) return compact;
  if (RWANDA_INTERNATIONAL_PHONE.test(compact)) return `0${compact.replace(/^\+?250/, '')}`;
  return null;
}

function passwordError(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Use at least 8 characters.';
  }
  if (password.length > 128) return 'Password must be 128 characters or fewer.';
  return null;
}

function collectValidationErrors({ fullname, email, password, confirmPassword, name, phone, busId, bookingId, username, from, to, time, price }) {
  const fields = {};
  const fullName = fullname === undefined ? name : fullname;

  if (fullName !== undefined) {
    const normalizedName = normalizeText(fullName);
    if (!NAME_PATTERN.test(normalizedName)) {
      fields[fullname === undefined ? 'name' : 'fullname'] = 'Enter a full name using letters, spaces, apostrophes, or hyphens.';
    }
  }
  if (email !== undefined && !EMAIL_PATTERN.test(normalizeEmail(email))) {
    fields.email = 'Enter a valid email address.';
  }
  if (password !== undefined) {
    const error = passwordError(password);
    if (error) fields.password = error;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    fields.confirmPassword = 'Passwords do not match.';
  }
  if (phone !== undefined && !normalizePhone(phone)) {
    fields.phone = 'Enter a valid Rwandan mobile number, for example 078 123 4567.';
  }
  if (busId !== undefined && !Number.isInteger(Number(busId)) || busId !== undefined && Number(busId) <= 0) {
    fields.busId = 'Choose an available bus before continuing.';
  }
  if (bookingId !== undefined && (!Number.isInteger(Number(bookingId)) || Number(bookingId) <= 0)) {
    fields.bookingId = 'A valid booking reference is required.';
  }
  if (username !== undefined && !normalizeText(username)) fields.username = 'Username is required.';
  if (from !== undefined && !normalizeText(from)) fields.from = 'Departure city is required.';
  if (to !== undefined && !normalizeText(to)) fields.to = 'Destination city is required.';
  if (time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fields.time = 'Enter a valid departure time.';
  if (price !== undefined && (!Number.isInteger(Number(price)) || Number(price) <= 0)) fields.price = 'Enter a valid price.';
  return fields;
}

function validationResult(values) {
  const fields = collectValidationErrors(values);
  return { valid: Object.keys(fields).length === 0, fields };
}

module.exports = {
  normalizeText,
  normalizeEmail,
  normalizePhone,
  passwordError,
  validationResult
};

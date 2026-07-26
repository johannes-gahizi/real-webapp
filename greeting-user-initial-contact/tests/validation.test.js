const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeText,
  normalizeEmail,
  normalizePhone,
  passwordError,
  validationResult
} = require('../services/inputValidation');

test('normalizeText handles strings and trims whitespace', () => {
  assert.equal(normalizeText('  Jean  Paul  '), 'Jean Paul');
  assert.equal(normalizeText(null), '');
  assert.equal(normalizeText(123), '');
});

test('normalizeEmail normalizes valid emails and lowercases them', () => {
  assert.equal(normalizeEmail(' USER@Example.COM '), 'user@example.com');
  assert.equal(normalizeEmail(''), '');
});

test('normalizePhone handles local and international Rwandan phone formats', () => {
  assert.equal(normalizePhone('078 123 4567'), '0781234567');
  assert.equal(normalizePhone(' 078-123-4567 '), '0781234567');
  assert.equal(normalizePhone('+250 78 123 4567'), '0781234567');
  assert.equal(normalizePhone('250781234567'), '0781234567');
  assert.equal(normalizePhone('0123456789'), null);
  assert.equal(normalizePhone('invalid'), null);
});

test('passwordError validates password length boundaries', () => {
  assert.equal(passwordError('short'), 'Use at least 8 characters.');
  assert.equal(passwordError('validPass123'), null);
  assert.equal(passwordError('a'.repeat(129)), 'Password must be 128 characters or fewer.');
});

test('validationResult returns valid status and collects detailed error fields', () => {
  const valid = validationResult({
    fullname: 'Jean Doe',
    email: 'jean@example.com',
    password: 'password123',
    phone: '0781234567',
    busId: 5
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.fields, {});

  const invalid = validationResult({
    fullname: '123 Bad Name',
    email: 'bad-email',
    password: 'short',
    phone: '0000',
    busId: 'invalid'
  });
  assert.equal(invalid.valid, false);
  assert.equal(typeof invalid.fields.fullname, 'string');
  assert.equal(typeof invalid.fields.email, 'string');
  assert.equal(typeof invalid.fields.password, 'string');
  assert.equal(typeof invalid.fields.phone, 'string');
  assert.equal(typeof invalid.fields.busId, 'string');
});

const express = require('express');
const authService = require('../services/authService');
const { APP_BASE_URL } = require('../config');
const { sendPasswordResetEmail } = require('../server-utils');
const { normalizeEmail, normalizeText, validationResult } = require('../services/inputValidation');

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  const { password } = req.body;
  const fullname = normalizeText(req.body.fullname);
  const email = normalizeEmail(req.body.email);
  const validation = validationResult({ fullname, email, password });
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields.', fields: validation.fields } });
  }

  try {
    const user = await authService.createUser(req.pool, { fullname, email, password });
    res.json({ success: true, token: user.id, userName: user.fullname });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'An account already exists for this email address.', fields: { email: 'Try logging in or use a different email address.' } } });
    }
    next(err);
  }
});

router.post('/user-login', async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  const validation = validationResult({ email });
  if (!email || !password || !validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Enter your email address and password.', fields: { ...validation.fields, ...(!password ? { password: 'Password is required.' } : {}) } } });
  }

  try {
    const user = await authService.verifyUserCredentials(req.pool, email, password);
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    }
    res.json({ success: true, token: user.id, userName: user.fullname });
  } catch (err) {
    next(err);
  }
});

router.post('/user/forgot-password', async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const validation = validationResult({ email });
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Enter a valid email address.', fields: validation.fields } });
  }

  try {
    const user = await authService.findUserByEmail(req.pool, email);
    const token = require('crypto').randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    const resetUrl = `${APP_BASE_URL}/reset-password.html?token=${token}`;

    if (user) {
      await authService.savePasswordResetToken(req.pool, email, token, expiresAt);
      await sendPasswordResetEmail({ to: email, resetUrl, appName: 'Gerayo' });
    }

    res.json({
      success: true,
      message: 'A password reset email has been sent if the account exists.',
      resetUrl: user ? resetUrl : null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/user/reset-password', async (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  const validation = validationResult({ password, confirmPassword });
  if (!token || !validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields.', fields: { ...validation.fields, ...(!token ? { token: 'This reset link is missing a token.' } : {}) } } });
  }

  try {
    const email = await authService.verifyResetToken(req.pool, token);
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_RESET_TOKEN', message: 'This reset link is invalid or has expired.' } });
    }

    await authService.updateUserPassword(req.pool, email, password);
    await authService.markResetTokenUsed(req.pool, token);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const username = normalizeText(req.body.username);
  const { password } = req.body;
  const validation = validationResult({ username });
  if (!username || !password || !validation.valid) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Enter your username and password.', fields: { ...validation.fields, ...(!password ? { password: 'Password is required.' } : {}) } } });
  }

  try {
    const company = await authService.verifyCompanyCredentials(req.pool, username, password);
    if (!company) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Username or password is incorrect.' } });
    }

    res.json({ success: true, token: company.id, companyName: company.name });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

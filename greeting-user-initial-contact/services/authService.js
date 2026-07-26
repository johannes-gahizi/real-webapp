const { hashPassword, verifyPassword } = require('../server-utils');

async function createUser(pool, { fullname, email, password }) {
  const result = await pool.query(
    'INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3) RETURNING id, fullname',
    [fullname, email, hashPassword(password)]
  );
  return result.rows[0];
}

async function findUserByEmail(pool, email) {
  const result = await pool.query(
    'SELECT id, fullname, password FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function verifyUserCredentials(pool, email, password) {
  const user = await findUserByEmail(pool, email);
  if (!user || !verifyPassword(password, user.password)) {
    return null;
  }
  return user;
}

async function savePasswordResetToken(pool, email, token, expiresAt) {
  await pool.query(
    'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
    [email, token, expiresAt]
  );
}

async function verifyResetToken(pool, token) {
  const result = await pool.query(
    'SELECT email FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()',
    [token]
  );
  return result.rows[0]?.email || null;
}

async function markResetTokenUsed(pool, token) {
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1', [token]);
}

async function updateUserPassword(pool, email, password) {
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashPassword(password), email]);
}

async function verifyCompanyCredentials(pool, username, password) {
  const result = await pool.query(
    'SELECT id, name, password FROM companies WHERE username = $1',
    [username]
  );
  const company = result.rows[0];
  if (!company || !verifyPassword(password, company.password)) {
    return null;
  }
  return { id: company.id, name: company.name };
}

module.exports = {
  createUser,
  findUserByEmail,
  verifyUserCredentials,
  savePasswordResetToken,
  verifyResetToken,
  markResetTokenUsed,
  updateUserPassword,
  verifyCompanyCredentials
};

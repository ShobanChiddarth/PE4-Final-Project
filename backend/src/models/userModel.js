import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const createUser = async (email, password, fullName) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, currency, theme`,
    [email, passwordHash, fullName || null]
  );
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await pool.query('SELECT id, email, full_name, currency, theme FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const updateUser = async (id, updates) => {
  const { fullName, avatarUrl, currency, theme } = updates;
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (fullName !== undefined) {
    updateFields.push(`full_name = $${paramIndex++}`);
    values.push(fullName);
  }
  if (avatarUrl !== undefined) {
    updateFields.push(`avatar_url = $${paramIndex++}`);
    values.push(avatarUrl);
  }
  if (currency !== undefined) {
    updateFields.push(`currency = $${paramIndex++}`);
    values.push(currency);
  }
  if (theme !== undefined) {
    updateFields.push(`theme = $${paramIndex++}`);
    values.push(theme);
  }

  if (updateFields.length === 0) {
    return null;
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, full_name, avatar_url, currency, theme`,
    values
  );

  return result.rows[0];
};

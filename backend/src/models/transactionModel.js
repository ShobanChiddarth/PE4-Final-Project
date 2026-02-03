import pool from '../config/database.js';

export const getTransactionsByUserId = async (userId, filters) => {
  let query = `
    SELECT 
      t.*,
      c.name as category_name, c.icon as category_icon, c.color as category_color,
      w.name as wallet_name, w.type as wallet_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.wallet_id = w.id
    WHERE t.user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  if (filters.startDate) {
    query += ` AND t.date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    query += ` AND t.date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }
  if (filters.categoryId) {
    query += ` AND t.category_id = $${paramIndex}`;
    params.push(filters.categoryId);
    paramIndex++;
  }
  if (filters.walletId) {
    query += ` AND t.wallet_id = $${paramIndex}`;
    params.push(filters.walletId);
    paramIndex++;
  }
  if (filters.type) {
    query += ` AND t.type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }
  if (filters.minAmount) {
    query += ` AND t.amount >= $${paramIndex}`;
    params.push(filters.minAmount);
    paramIndex++;
  }
  if (filters.maxAmount) {
    query += ` AND t.amount <= $${paramIndex}`;
    params.push(filters.maxAmount);
    paramIndex++;
  }
  if (filters.search) {
    query += ` AND t.description ILIKE $${paramIndex}`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT 100`;

  const result = await pool.query(query, params);
  return result.rows;
};

export const getTransactionById = async (id, userId) => {
  const result = await pool.query(
    `SELECT 
      t.*,
      c.name as category_name, c.icon as category_icon, c.color as category_color,
      w.name as wallet_name, w.type as wallet_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.wallet_id = w.id
    WHERE t.id = $1 AND t.user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
};

export const createTransaction = async (userId, { amount, type, description, date, walletId, categoryId, receiptUrl, isRecurring, recurringFrequency, recurringEndDate }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert transaction
    const result = await client.query(
      `INSERT INTO transactions 
        (user_id, wallet_id, category_id, amount, type, description, date, receipt_url, is_recurring, recurring_frequency, recurring_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, walletId, categoryId || null, amount, type, description || null, date, receiptUrl || null, isRecurring || false, recurringFrequency || null, recurringEndDate || null]
    );

    // Update wallet balance
    const amountChange = type === 'income' ? amount : -amount;
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
      [amountChange, walletId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateTransaction = async (id, userId, { amount, type, description, date, walletId, categoryId, receiptUrl, isRecurring, recurringFrequency, recurringEndDate }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get old transaction
    const oldTx = await client.query(
      'SELECT wallet_id, amount, type FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (oldTx.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const oldAmountChange = oldTx.rows[0].type === 'income' ? -oldTx.rows[0].amount : oldTx.rows[0].amount;
    const newAmountChange = type === 'income' ? amount : -amount;

    // Update transaction
    const result = await client.query(
      `UPDATE transactions 
       SET amount = $1, type = $2, description = $3, date = $4, wallet_id = $5, category_id = $6, 
           receipt_url = $7, is_recurring = $8, recurring_frequency = $9, recurring_end_date = $10
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [amount, type, description || null, date, walletId, categoryId || null, receiptUrl || null, isRecurring || false, recurringFrequency || null, recurringEndDate || null, id, userId]
    );

    // Update wallet balances
    if (oldTx.rows[0].wallet_id !== walletId) {
      // Old wallet: reverse old transaction
      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [oldAmountChange, oldTx.rows[0].wallet_id]
      );
      // New wallet: apply new transaction
      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [newAmountChange, walletId]
      );
    } else {
      // Same wallet: adjust difference
      const diff = newAmountChange - oldAmountChange;
      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [diff, walletId]
      );
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteTransaction = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldTx = await client.query(
      'SELECT wallet_id, amount, type FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (oldTx.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    await client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);

    // Reverse wallet balance
    const amountChange = oldTx.rows[0].type === 'income' ? -oldTx.rows[0].amount : oldTx.rows[0].amount;
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
      [amountChange, oldTx.rows[0].wallet_id]
    );

    await client.query('COMMIT');
    return { message: 'Transaction deleted successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

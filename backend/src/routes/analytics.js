import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Spending by category
router.get('/spending-by-category', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(t.amount), 0)::numeric as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id 
        AND t.user_id = $1 
        AND t.type = 'expense'
        ${startDate ? 'AND t.date >= $2' : ''}
        ${endDate ? `AND t.date <= $${startDate ? '3' : '2'}` : ''}
      WHERE c.user_id = $1 AND c.type = 'expense'
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC
    `;

    const params = [req.user.id];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Monthly trends
router.get('/monthly-trends', authenticateToken, async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const result = await pool.query(
      `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
      FROM transactions
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
      `,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Net savings overview
router.get('/net-savings', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_savings
      FROM transactions
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    const walletsResult = await pool.query(
      'SELECT SUM(balance) as total_balance FROM wallets WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    res.json({
      ...result.rows[0],
      total_balance: parseFloat(walletsResult.rows[0].total_balance || 0),
    });
  } catch (error) {
    next(error);
  }
});

// Top transactions
router.get('/top-transactions', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 10, type } = req.query;
    let query = `
      SELECT 
        t.*,
        c.name as category_name, c.icon as category_icon, c.color as category_color,
        w.name as wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.user_id = $1
    `;
    const params = [req.user.id];

    if (type) {
      query += ` AND t.type = $2`;
      params.push(type);
    }

    query += ` ORDER BY t.amount DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;

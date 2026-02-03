import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateWallet } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ wallets: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, validateWallet, async (req, res, next) => {
  try {
    const { name, type, balance, currency } = req.body;
    const result = await pool.query(
      `INSERT INTO wallets (user_id, name, type, balance, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, name, type, balance || 0, currency || req.user.currency || 'USD']
    );
    res.status(201).json({ wallet: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, validateWallet, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, balance, currency, isActive } = req.body;
    const result = await pool.query(
      `UPDATE wallets 
       SET name = $1, type = $2, balance = $3, currency = $4, is_active = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, type, balance, currency, isActive !== undefined ? isActive : true, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if wallet has transactions
    const txCheck = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE wallet_id = $1',
      [id]
    );

    if (parseInt(txCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete wallet with existing transactions' });
    }

    const result = await pool.query(
      'DELETE FROM wallets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ message: 'Wallet deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

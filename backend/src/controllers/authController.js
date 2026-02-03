import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as UserModel from '../models/userModel.js';
import pool from '../config/database.js';

export const signup = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    const existingUser = await UserModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await UserModel.createUser(email, password, fullName);
    const userId = user.id;

    // Create default categories for new user
    const defaultCategories = [
      { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B', type: 'expense' },
      { name: 'Shopping', icon: '🛍️', color: '#4ECDC4', type: 'expense' },
      { name: 'Transportation', icon: '🚗', color: '#45B7D1', type: 'expense' },
      { name: 'Bills & Utilities', icon: '💡', color: '#FFA07A', type: 'expense' },
      { name: 'Entertainment', icon: '🎬', color: '#98D8C8', type: 'expense' },
      { name: 'Healthcare', icon: '🏥', color: '#F7DC6F', type: 'expense' },
      { name: 'Salary', icon: '💰', color: '#52BE80', type: 'income' },
      { name: 'Freelance', icon: '💼', color: '#5DADE2', type: 'income' },
      { name: 'Investment', icon: '📈', color: '#58D68D', type: 'income' },
    ];
    for (const cat of defaultCategories) {
      await pool.query(
        `INSERT INTO categories (user_id, name, icon, color, type)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, cat.name, cat.icon, cat.color, cat.type]
      );
    }

    // Create default wallet for new user
    await pool.query(
      `INSERT INTO wallets (user_id, name, type, balance, currency)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'Main Wallet', 'bank', 0, 'USD']
    );

    res.status(201).json({ message: 'User registered successfully. Please log in.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        currency: user.currency,
        theme: user.theme,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(error);
  }
};

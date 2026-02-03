import pool from '../config/database.js';

export const getGoalsByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const createGoal = async (userId, { name, targetAmount, currentAmount, targetDate, description }) => {
  const result = await pool.query(
    `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, targetAmount, currentAmount || 0, targetDate || null, description || null]
  );
  return result.rows[0];
};

export const updateGoal = async (id, userId, { name, targetAmount, currentAmount, targetDate, description }) => {
  const result = await pool.query(
    `UPDATE savings_goals 
     SET name = $1, target_amount = $2, current_amount = $3, target_date = $4, description = $5
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [name, targetAmount, currentAmount, targetDate || null, description || null, id, userId]
  );
  return result.rows[0];
};

export const deleteGoal = async (id, userId) => {
  const result = await pool.query(
    'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
};

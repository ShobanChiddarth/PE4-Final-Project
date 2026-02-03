import pool from '../config/database.js';

export const getCategoriesByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY name',
    [userId]
  );
  return result.rows;
};

export const createCategory = async (userId, { name, icon, color, type }) => {
  const result = await pool.query(
    `INSERT INTO categories (user_id, name, icon, color, type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, icon || null, color || null, type]
  );
  return result.rows[0];
};

export const updateCategory = async (id, userId, { name, icon, color, type }) => {
  const result = await pool.query(
    `UPDATE categories 
     SET name = $1, icon = $2, color = $3, type = $4
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [name, icon || null, color || null, type, id, userId]
  );
  return result.rows[0];
};

export const deleteCategory = async (id, userId) => {
  const result = await pool.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
};

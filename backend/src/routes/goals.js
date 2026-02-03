import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateGoal } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticateToken, getGoals);
router.post('/', authenticateToken, validateGoal, createGoal);
router.put('/:id', authenticateToken, validateGoal, updateGoal);
router.delete('/:id', authenticateToken, deleteGoal);

export default router;

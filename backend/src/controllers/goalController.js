import * as GoalModel from '../models/goalModel.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await GoalModel.getGoalsByUserId(req.user.id);
    res.json({ goals });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await GoalModel.createGoal(req.user.id, req.body);
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goal = await GoalModel.updateGoal(id, req.user.id, req.body);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ goal });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goal = await GoalModel.deleteGoal(id, req.user.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

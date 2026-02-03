import * as UserModel from '../models/userModel.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await UserModel.updateUser(req.user.id, req.body);
    if (!updatedUser) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

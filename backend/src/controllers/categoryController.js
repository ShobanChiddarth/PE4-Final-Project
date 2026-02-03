import * as CategoryModel from '../models/categoryModel.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await CategoryModel.getCategoriesByUserId(req.user.id);
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await CategoryModel.createCategory(req.user.id, req.body);
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.updateCategory(id, req.user.id, req.body);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.deleteCategory(id, req.user.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

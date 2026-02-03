import * as TransactionModel from '../models/transactionModel.js';

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await TransactionModel.getTransactionsByUserId(req.user.id, req.query);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionModel.getTransactionById(id, req.user.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await TransactionModel.createTransaction(req.user.id, req.body);
    res.status(201).json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionModel.updateTransaction(id, req.user.id, req.body);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await TransactionModel.deleteTransaction(id, req.user.id);
    res.json({ message: result.message });
  } catch (error) {
    next(error);
  }
};

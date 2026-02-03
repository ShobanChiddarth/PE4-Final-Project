import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').optional().trim().isLength({ min: 1 }),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateTransaction = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('date').isISO8601().toDate(),
  body('walletId').isUUID().withMessage('Valid wallet ID required'),
  body('categoryId').optional().isUUID(),
  handleValidationErrors,
];

export const validateCategory = [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['income', 'expense']),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  handleValidationErrors,
];

export const validateWallet = [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['cash', 'bank', 'card', 'credit', 'investment']),
  handleValidationErrors,
];

export const validateGoal = [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('targetAmount').isFloat({ min: 0.01 }),
  body('targetDate').optional().isISO8601().toDate(),
  handleValidationErrors,
];

const { body } = require('express-validator');

const VALID_ROLES = ['Admin', 'Manager', 'Employee'];

const login = [
  body('user_name')
    .trim()
    .notEmpty().withMessage('user_name is required.'),

  body('password')
    .notEmpty().withMessage('password is required.'),
];

const register = [
  body('user_name')
    .trim()
    .notEmpty().withMessage('user_name is required.')
    .isLength({ min: 3, max: 50 }).withMessage('user_name must be between 3 and 50 characters.')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('user_name may only contain letters, numbers, underscores, hyphens and dots.'),

  body('full_name')
    .trim()
    .notEmpty().withMessage('full_name is required.')
    .isLength({ max: 150 }).withMessage('full_name must not exceed 150 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('email is required.')
    .isEmail().withMessage('email must be a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('password is required.')
    .isLength({ min: 8 }).withMessage('password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('password must contain at least one number.'),

  body('role')
    .optional()
    .isIn(VALID_ROLES).withMessage(`role must be one of: ${VALID_ROLES.join(', ')}.`),

  body('department_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('department_id must be a positive integer.'),
];

const selfRegister = [
  body('user_name')
    .trim()
    .notEmpty().withMessage('user_name is required.')
    .isLength({ min: 3, max: 50 }).withMessage('user_name must be between 3 and 50 characters.')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('user_name may only contain letters, numbers, underscores, hyphens and dots.'),

  body('full_name')
    .trim()
    .notEmpty().withMessage('full_name is required.')
    .isLength({ max: 150 }).withMessage('full_name must not exceed 150 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('email is required.')
    .isEmail().withMessage('email must be a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('password is required.')
    .isLength({ min: 8 }).withMessage('password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('password must contain at least one number.'),

  body('department_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('department_id must be a positive integer.'),
];

module.exports = { login, register, selfRegister };

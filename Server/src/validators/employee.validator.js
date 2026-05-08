const { body } = require('express-validator');

const VALID_ROLES = ['Admin', 'Manager', 'Employee'];

const create = [
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

  body('department_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('department_id must be a positive integer.'),

  body('actif')
    .optional()
    .isBoolean().withMessage('actif must be a boolean.'),
];

const update = [
  body('full_name')
    .optional()
    .trim()
    .notEmpty().withMessage('full_name cannot be empty.')
    .isLength({ max: 150 }).withMessage('full_name must not exceed 150 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('email must be a valid email address.')
    .normalizeEmail(),

  body('department_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('department_id must be a positive integer.'),

  body('actif')
    .optional()
    .isBoolean().withMessage('actif must be a boolean.'),
];

const updateRole = [
  body('role')
    .notEmpty().withMessage('role is required.')
    .isIn(VALID_ROLES).withMessage(`role must be one of: ${VALID_ROLES.join(', ')}.`),
];

module.exports = { create, update, updateRole };

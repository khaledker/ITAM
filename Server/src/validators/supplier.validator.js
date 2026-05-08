const { body } = require('express-validator');

const create = [
  body('name')
    .trim()
    .notEmpty().withMessage('name is required.')
    .isLength({ max: 150 }).withMessage('name must not exceed 150 characters.'),

  body('code')
    .trim()
    .notEmpty().withMessage('code is required.')
    .isLength({ max: 50 }).withMessage('code must not exceed 50 characters.'),

  body('tel')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('tel must not exceed 50 characters.'),

  body('contact')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('contact must not exceed 150 characters.'),
];

const update = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('name cannot be empty.')
    .isLength({ max: 150 }).withMessage('name must not exceed 150 characters.'),

  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('code cannot be empty.')
    .isLength({ max: 50 }).withMessage('code must not exceed 50 characters.'),

  body('tel')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('tel must not exceed 50 characters.'),

  body('contact')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('contact must not exceed 150 characters.'),
];

module.exports = { create, update };

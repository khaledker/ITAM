const { body } = require('express-validator');

const VALID_TYPES = ['AdministrativeBlock', 'TrainingRoom', 'Warehouse', 'CallCenter'];

const create = [
  body('code')
    .trim()
    .notEmpty().withMessage('code is required.')
    .isLength({ max: 50 }).withMessage('code must not exceed 50 characters.'),

  body('label')
    .trim()
    .notEmpty().withMessage('label is required.')
    .isLength({ max: 150 }).withMessage('label must not exceed 150 characters.'),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('region must not exceed 100 characters.'),

  body('site')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('site must not exceed 150 characters.'),

  body('type')
    .optional()
    .isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}.`),
];

const update = [
  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('code cannot be empty.')
    .isLength({ max: 50 }).withMessage('code must not exceed 50 characters.'),

  body('label')
    .optional()
    .trim()
    .notEmpty().withMessage('label cannot be empty.')
    .isLength({ max: 150 }).withMessage('label must not exceed 150 characters.'),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('region must not exceed 100 characters.'),

  body('site')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('site must not exceed 150 characters.'),

  body('type')
    .optional()
    .isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}.`),
];

module.exports = { create, update };

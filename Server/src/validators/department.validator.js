const { body } = require('express-validator');

const create = [
  body('code')
    .trim()
    .notEmpty().withMessage('code is required.')
    .isLength({ max: 50 }).withMessage('code must not exceed 50 characters.'),

  body('libelle')
    .trim()
    .notEmpty().withMessage('libelle is required.')
    .isLength({ max: 150 }).withMessage('libelle must not exceed 150 characters.'),
];

const update = [
  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('code cannot be empty.')
    .isLength({ max: 50 }).withMessage('code must not exceed 50 characters.'),

  body('libelle')
    .optional()
    .trim()
    .notEmpty().withMessage('libelle cannot be empty.')
    .isLength({ max: 150 }).withMessage('libelle must not exceed 150 characters.'),
];

module.exports = { create, update };

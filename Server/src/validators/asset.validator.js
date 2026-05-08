const { body } = require('express-validator');

const VALID_STATUSES = ['Available', 'Assigned', 'inMaintenance', 'retired'];

const create = [
  body('serial_number')
    .trim()
    .notEmpty().withMessage('serial_number is required.')
    .isLength({ max: 100 }).withMessage('serial_number must not exceed 100 characters.'),

  body('tag')
    .trim()
    .notEmpty().withMessage('tag is required.')
    .isLength({ max: 100 }).withMessage('tag must not exceed 100 characters.'),

  body('model_id')
    .notEmpty().withMessage('model_id is required.')
    .isInt({ min: 1 }).withMessage('model_id must be a positive integer.'),

  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}.`),

  body('date_acq')
    .optional({ nullable: true })
    .isISO8601().withMessage('date_acq must be a valid date (YYYY-MM-DD).'),

  body('description')
    .optional()
    .isLength({ max: 255 }).withMessage('description must not exceed 255 characters.'),

  body('location_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('location_id must be a positive integer.'),
];

const update = [
  body('serial_number')
    .trim()
    .notEmpty().withMessage('serial_number is required.')
    .isLength({ max: 100 }).withMessage('serial_number must not exceed 100 characters.'),

  body('tag')
    .trim()
    .notEmpty().withMessage('tag is required.')
    .isLength({ max: 100 }).withMessage('tag must not exceed 100 characters.'),

  body('model_id')
    .notEmpty().withMessage('model_id is required.')
    .isInt({ min: 1 }).withMessage('model_id must be a positive integer.'),

  body('status')
    .notEmpty().withMessage('status is required.')
    .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}.`),

  body('date_acq')
    .optional({ nullable: true })
    .isISO8601().withMessage('date_acq must be a valid date (YYYY-MM-DD).'),

  body('description')
    .optional()
    .isLength({ max: 255 }).withMessage('description must not exceed 255 characters.'),

  body('location_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('location_id must be a positive integer.'),
];

module.exports = { create, update };

const { body } = require('express-validator');

// ── Shared required fields for every movement ──────────────
const baseMovement = [
  body('date')
    .notEmpty().withMessage('date is required.')
    .isISO8601().withMessage('date must be a valid date (YYYY-MM-DD).'),

  body('asset_ids')
    .notEmpty().withMessage('asset_ids is required.')
    .isArray({ min: 1 }).withMessage('asset_ids must be a non-empty array of IDs.'),

  body('performed_by')
    .notEmpty().withMessage('performed_by is required.')
    .isInt({ min: 1 }).withMessage('performed_by must be a positive integer.'),
];

// ── Reception ──────────────────────────────────────────────
const createReception = [
  ...baseMovement,

  body('purchase_order_number')
    .optional()
    .isLength({ max: 100 }).withMessage('purchase_order_number must not exceed 100 characters.'),

  body('receipt_number')
    .optional()
    .isLength({ max: 100 }).withMessage('receipt_number must not exceed 100 characters.'),

  body('supplier_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('supplier_id must be a positive integer.'),

  body('destination_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('destination_id must be a positive integer.'),
];

// ── Assignment ─────────────────────────────────────────────
const createAssignment = [
  ...baseMovement,

  body('assigned_to')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('assigned_to must be a positive integer.'),

  body('source_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('source_id must be a positive integer.'),

  body('expected_return')
    .optional({ nullable: true })
    .isISO8601().withMessage('expected_return must be a valid date (YYYY-MM-DD).'),
];

// ── Transfer ───────────────────────────────────────────────
const createTransfer = [
  ...baseMovement,

  body('reference')
    .optional()
    .isLength({ max: 100 }).withMessage('reference must not exceed 100 characters.'),

  body('source_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('source_id must be a positive integer.'),

  body('destination_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('destination_id must be a positive integer.'),
];

// ── Return ─────────────────────────────────────────────────
const createReturn = [
  ...baseMovement,

  body('reason')
    .optional()
    .isLength({ max: 255 }).withMessage('reason must not exceed 255 characters.'),

  body('returned_to')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('returned_to must be a positive integer.'),
];

module.exports = { createReception, createAssignment, createTransfer, createReturn };

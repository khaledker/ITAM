const { validationResult } = require('express-validator');
const db = require('../config/db');

/**
 * Collects express-validator errors and returns a 422 if any exist.
 * Place this AFTER your validation chain in the route definition.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * Validates assets exist and are in correct status for the operation.
 * Usage: validateAssetStatus('assignment', 'body', 'assetIds')
 */
const validateAssetStatus = (operation, source = 'body', field = 'assetIds') => {
  return async (req, res, next) => {
    try {
      const assetIds = req[source][field];

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return next(); // No assets to validate, let route handle it
      }

      // Status rules per operation
      const statusRules = {
        'reception': {
          allowed: [], // New assets won't exist yet. If IDs provided, they must be 'Available'
          allowNew: true,
          message: 'Asset already exists and is not available for reception'
        },
        'assignment': {
          allowed: ['Available'],
          message: 'Only Available assets can be assigned'
        },
        'transfer': {
          allowed: ['Available', 'Assigned'],
          message: 'Assets in current status cannot be transferred'
        },
        'return': {
          allowed: ['Assigned'],
          message: 'Only Assigned assets can be returned'
        },
        'maintenance': {
          allowed: ['Available', 'Assigned'],
          message: 'Asset cannot be sent to maintenance in current status'
        },
        'retire': {
          allowed: ['Available', 'inMaintenance'],
          message: 'Asset cannot be retired in current status'
        },
      };

      const rule = statusRules[operation];
      if (!rule) return next(); // Unknown operation, skip

      // Fetch assets
      const placeholders = assetIds.map(() => '?').join(',');
      const [assets] = await db.query(
        `SELECT id, serial_number, tag, status FROM Asset WHERE id IN (${placeholders})`,
        assetIds
      );

      // Check existence
      if (assets.length !== assetIds.length) {
        const foundIds = assets.map(a => a.id);
        const missing = assetIds.filter(id => !foundIds.includes(id));
        return res.status(404).json({
          message: `Assets not found: ${missing.join(', ')}`
        });
      }

      // Check status
      const invalidAssets = assets.filter(a => !rule.allowed.includes(a.status));
      if (invalidAssets.length > 0) {
        const details = invalidAssets
          .map(a => `${a.serial_number} (${a.tag}) is ${a.status}`)
          .join(', ');
        return res.status(400).json({
          message: `${rule.message}: ${details}`
        });
      }

      // Attach validated assets to request for use in route
      req.validatedAssets = assets;
      next();
    } catch (err) {
      next(err);
    }
  };
};

validate.validateAssetStatus = validateAssetStatus;
module.exports = validate;
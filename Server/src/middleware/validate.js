const { validationResult } = require('express-validator');

/**
 * Collects express-validator errors and returns a 422 if any exist.
 * Place this AFTER your validation chain in the route definition.
 *
 * Example:
 *   router.post('/', validators.createAsset, validate, ctrl.create);
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

module.exports = validate;

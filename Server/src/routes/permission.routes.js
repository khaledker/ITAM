const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const permissionService = require('../services/permission.service');

router.use(protect);

// GET /api/employees/:id/permissions — Admin only
router.get('/:id/permissions', authorize('Admin'), async (req, res, next) => {
  try {
    const data = await permissionService.getPermissions(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
});

// PUT /api/employees/:id/permissions — Admin only
// Body: { permissions: string[], locationIds: number[] }
router.put('/:id/permissions', authorize('Admin'), async (req, res, next) => {
  try {
    const { permissions, locationIds } = req.body;
    await permissionService.setAll(req.params.id, { permissions, locationIds });
    const updated = await permissionService.getPermissions(req.params.id);
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;

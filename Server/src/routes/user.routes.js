const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');
const permissionService = require('../services/permission.service');

router.use(protect);

// User CRUD
router.get('/', authorize('Admin'), ctrl.getAll);
router.post('/', authorize('Admin'), ctrl.create);
router.patch('/:id/role', authorize('Admin'), ctrl.updateRole);

// Manager Permissions
router.get('/:id/permissions', authorize('Admin'), async (req, res, next) => {
  try { res.json(await permissionService.getPermissions(req.params.id)); }
  catch (err) { next(err); }
});

router.put('/:id/permissions', authorize('Admin'), async (req, res, next) => {
  try {
    const { permissions, locationIds } = req.body;
    await permissionService.setAll(req.params.id, { permissions, locationIds });
    res.json(await permissionService.getPermissions(req.params.id));
  } catch (err) { next(err); }
});

module.exports = router;

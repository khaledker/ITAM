const router   = require('express').Router();
const ctrl     = require('../controllers/movement.controller');
const { protect, authorize, requirePermission, requireLocationAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateAssetStatus } = validate;
const v        = require('../validators/movement.validator');

router.use(protect);

// All roles can view (Managers need consultation permission)
router.get('/',       requirePermission('consultation'), ctrl.getAll);
router.get('/:id',    requirePermission('consultation'), ctrl.getOne);
router.get('/:id/ticket', ctrl.downloadTicket);

// Admin + Manager can create movements (with specific permissions)
router.post('/reception',  
  authorize('Admin', 'Manager'), 
  requirePermission('reception'),  
  requireLocationAccess('body', 'destination_id'),
  v.createReception,  
  validate, 
  ctrl.createReception
);

router.post('/assignment', 
  authorize('Admin', 'Manager'), 
  requirePermission('assignment'), 
  requireLocationAccess('body', 'source_id'),
  validateAssetStatus('assignment', 'body', 'asset_ids'),
  v.createAssignment, 
  validate, 
  ctrl.createAssignment
);

router.post('/transfer',   
  authorize('Admin', 'Manager'), 
  requirePermission('transfer'),   
  requireLocationAccess('body', ['source_id', 'destination_id']),
  validateAssetStatus('transfer', 'body', 'asset_ids'),
  v.createTransfer,   
  validate, 
  ctrl.createTransfer
);

router.post('/return',     
  requirePermission('return'), 
  requireLocationAccess('body', 'returned_to'),
  validateAssetStatus('return', 'body', 'asset_ids'),
  v.createReturn, 
  validate, 
  ctrl.createReturn
);

// Only Admin + Manager can approve or reject
router.patch('/:id/approve', authorize('Admin', 'Manager'), ctrl.approve);
router.patch('/:id/reject',  authorize('Admin', 'Manager'), ctrl.reject);
router.patch('/:id/confirm', authorize('Admin', 'Manager'), ctrl.confirm);

module.exports = router;

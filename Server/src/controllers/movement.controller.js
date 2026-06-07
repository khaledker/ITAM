const svc = require('../services/movement.service');

// Helper: extract location scoping from request
const getScopeOptions = (req) => {
  if (req.user && req.user.role === 'Manager' && req.user.locationIds) {
    return { scopeLocationIds: req.user.locationIds };
  }
  return {};
};

const getAll = async (req, res, next) => {
  try {
    const filters = { ...req.query, ...getScopeOptions(req) };
    res.json(await svc.findAll(filters));
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const mv = await svc.findById(req.params.id);
    if (!mv) return res.status(404).json({ message: 'Movement not found.' });
    res.json(mv);
  } catch (err) { next(err); }
};

// POST /api/movements/reception
const createReception = async (req, res, next) => {
  try {
    const { date, asset_ids, performed_by } = req.body;
    if (!date || !asset_ids || !performed_by)
      return res.status(400).json({ message: 'date, asset_ids, performed_by are required.' });
    res.status(201).json(await svc.createReception(req.body));
  } catch (err) { next(err); }
};

// POST /api/movements/assignment
const createAssignment = async (req, res, next) => {
  try {
    const { date, asset_ids, performed_by } = req.body;
    if (!date || !asset_ids || !performed_by)
      return res.status(400).json({ message: 'date, asset_ids, performed_by are required.' });
    res.status(201).json(await svc.createAssignment(req.body));
  } catch (err) { next(err); }
};

// POST /api/movements/transfer
const createTransfer = async (req, res, next) => {
  try {
    const { date, asset_ids, performed_by } = req.body;
    if (!date || !asset_ids || !performed_by)
      return res.status(400).json({ message: 'date, asset_ids, performed_by are required.' });
    res.status(201).json(await svc.createTransfer(req.body));
  } catch (err) { next(err); }
};

// POST /api/movements/return
const createReturn = async (req, res, next) => {
  try {
    const { date, asset_ids, performed_by } = req.body;
    if (!date || !asset_ids || !performed_by)
      return res.status(400).json({ message: 'date, asset_ids, performed_by are required.' });
    res.status(201).json(await svc.createReturn(req.body));
  } catch (err) { next(err); }
};

// PATCH /api/movements/:id/approve
const approve = async (req, res, next) => {
  try {
    res.json(await svc.updateStatus(req.params.id, 'Approved'));
  } catch (err) { next(err); }
};

// PATCH /api/movements/:id/reject
const reject = async (req, res, next) => {
  try {
    res.json(await svc.updateStatus(req.params.id, 'Rejected'));
  } catch (err) { next(err); }
};

// PATCH /api/movements/:id/confirm (for Transfer)
const confirm = async (req, res, next) => {
  try {
    res.json(await svc.updateStatus(req.params.id, 'Completed'));
  } catch (err) { next(err); }
};

// GET /api/movements/:id/ticket
const downloadTicket = async (req, res, next) => {
  try {
    const mv = await svc.findById(req.params.id);
    if (!mv) return res.status(404).json({ message: 'Movement not found.' });
    if (mv.status === 'Draft' || mv.status === 'Rejected') {
      return res.status(400).json({ message: 'Cannot generate ticket for Draft or Rejected movements.' });
    }

    const pdfService = require('../services/pdf.service');
    
    // Set response headers for PDF download
    const filename = `TKT-${mv.type.substring(0, 3).toUpperCase()}-${String(mv.id).padStart(4, '0')}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    // Generate and stream the PDF
    pdfService.generateMovementTicket(mv, res);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, createReception, createAssignment, createTransfer, createReturn, approve, reject, confirm, downloadTicket };

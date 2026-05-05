const svc = require('../services/movement.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll(req.query)); } catch (err) { next(err); }
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
    const { date, asset_id, performed_by } = req.body;
    if (!date || !asset_id || !performed_by)
      return res.status(400).json({ message: 'date, asset_id, performed_by are required.' });
    res.status(201).json(await svc.createReception(req.body));
  } catch (err) { next(err); }
};

// POST /api/movements/assignment
const createAssignment = async (req, res, next) => {
  try {
    const { date, asset_id, performed_by } = req.body;
    if (!date || !asset_id || !performed_by)
      return res.status(400).json({ message: 'date, asset_id, performed_by are required.' });
    res.status(201).json(await svc.createAssignment(req.body));
  } catch (err) { next(err); }
};

// POST /api/movements/transfer
const createTransfer = async (req, res, next) => {
  try {
    const { date, asset_id, performed_by } = req.body;
    if (!date || !asset_id || !performed_by)
      return res.status(400).json({ message: 'date, asset_id, performed_by are required.' });
    res.status(201).json(await svc.createTransfer(req.body));
  } catch (err) { next(err); }
};

// POST /api/movements/return
const createReturn = async (req, res, next) => {
  try {
    const { date, asset_id, performed_by } = req.body;
    if (!date || !asset_id || !performed_by)
      return res.status(400).json({ message: 'date, asset_id, performed_by are required.' });
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

module.exports = { getAll, getOne, createReception, createAssignment, createTransfer, createReturn, approve, reject };

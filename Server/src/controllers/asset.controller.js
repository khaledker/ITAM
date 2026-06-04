const svc = require('../services/asset.service');

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
    const asset = await svc.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    // Managers can only view assets in their locations
    const scope = getScopeOptions(req);
    if (scope.scopeLocationIds && scope.scopeLocationIds.length > 0) {
      if (asset.location && !scope.scopeLocationIds.includes(asset.location.id)) {
        return res.status(403).json({ message: 'Access denied. Asset is not in your assigned locations.' });
      }
    }

    res.json(asset);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { serial_number, tag, status, date_acq, description, model_id, location_id, employee_id } = req.body;
    if (!serial_number || !tag || !model_id)
      return res.status(400).json({ message: 'serial_number, tag, model_id are required.' });
    res.status(201).json(await svc.create(req.body));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const asset = await svc.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    res.json(await svc.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await svc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Asset not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    res.json(await svc.getMovementHistory(req.params.id));
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    res.json(await svc.getStats(getScopeOptions(req)));
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getHistory, getStats };

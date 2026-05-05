const svc = require('../services/asset.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll(req.query)); } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const asset = await svc.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    res.json(asset);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { serial_number, tag, model_id } = req.body;
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
    const asset = await svc.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    res.json(await svc.getMovementHistory(req.params.id));
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try { res.json(await svc.getStats()); } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getHistory, getStats };

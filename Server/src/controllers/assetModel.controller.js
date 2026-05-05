const svc = require('../services/assetModel.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll(req.query)); } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const m = await svc.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Asset model not found.' });
    res.json(m);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, code, brand, category, part_number } = req.body;
    if (!name || !code)
      return res.status(400).json({ message: 'name and code are required.' });
    res.status(201).json(await svc.create({ name, code, brand, category, part_number }));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const m = await svc.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Asset model not found.' });
    res.json(await svc.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await svc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Asset model not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };

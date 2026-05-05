const svc = require('../services/location.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll(req.query.type)); } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const loc = await svc.findById(req.params.id);
    if (!loc) return res.status(404).json({ message: 'Location not found.' });
    res.json(loc);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { code, label, region, site, type } = req.body;
    if (!code || !label)
      return res.status(400).json({ message: 'code and label are required.' });
    res.status(201).json(await svc.create({ code, label, region, site, type }));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const loc = await svc.findById(req.params.id);
    if (!loc) return res.status(404).json({ message: 'Location not found.' });
    res.json(await svc.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await svc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Location not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
};

const getAssets = async (req, res, next) => {
  try {
    const loc = await svc.findById(req.params.id);
    if (!loc) return res.status(404).json({ message: 'Location not found.' });
    res.json(await svc.getAssets(req.params.id));
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getAssets };

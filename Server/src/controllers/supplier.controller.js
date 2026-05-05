const svc = require('../services/supplier.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll()); } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const s = await svc.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Supplier not found.' });
    res.json(s);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, code, tel, contact } = req.body;
    if (!name || !code)
      return res.status(400).json({ message: 'name and code are required.' });
    res.status(201).json(await svc.create({ name, code, tel, contact }));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const s = await svc.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Supplier not found.' });
    res.json(await svc.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await svc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Supplier not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };

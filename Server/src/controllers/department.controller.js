const svc = require('../services/department.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll()); } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const dept = await svc.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found.' });
    res.json(dept);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { code, libelle } = req.body;
    if (!code || !libelle)
      return res.status(400).json({ message: 'code and libelle are required.' });
    res.status(201).json(await svc.create({ code, libelle }));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const dept = await svc.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found.' });
    res.json(await svc.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await svc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Department not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
};

const getEmployees = async (req, res, next) => {
  try {
    const dept = await svc.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found.' });
    res.json(await svc.getEmployees(req.params.id));
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getEmployees };

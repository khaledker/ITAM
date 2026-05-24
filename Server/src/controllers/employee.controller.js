const svc = require('../services/employee.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll()); } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const emp = await svc.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    res.json(emp);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { user_name, full_name, email, department_id, status, password, role } = req.body;
    if (!user_name || !full_name || !email)
      return res.status(400).json({ message: 'user_name, full_name, email are required.' });
    res.status(201).json(await svc.create({ user_name, full_name, email, department_id, status, password, role }));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const emp = await svc.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    res.json(await svc.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await svc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Employee not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
};

const getAssets = async (req, res, next) => {
  try {
    const emp = await svc.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    res.json(await svc.getAssignedAssets(req.params.id));
  } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'role is required.' });
    const emp = await svc.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    res.json(await svc.updateRole(req.params.id, role));
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getAssets, updateRole };

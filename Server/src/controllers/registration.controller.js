const svc = require('../services/registration.service');

const submitRequest = async (req, res, next) => {
  try {
    const { user_name, full_name, email, password, department_id } = req.body;
    const result = await svc.createRequest({ user_name, full_name, email, password, department_id });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    const rows = await svc.findAll({ status });
    res.json(rows);
  } catch (err) { next(err); }
};

const approve = async (req, res, next) => {
  try {
    const result = await svc.approve(req.params.id, req.user.id);
    res.json(result);
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    const result = await svc.reject(req.params.id, req.user.id);
    res.json(result);
  } catch (err) { next(err); }
};

const getPendingCount = async (req, res, next) => {
  try {
    const count = await svc.getPendingCount();
    res.json({ count });
  } catch (err) { next(err); }
};

module.exports = { submitRequest, getAll, approve, reject, getPendingCount };

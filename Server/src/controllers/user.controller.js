const svc = require('../services/user.service');

const getAll = async (req, res, next) => {
  try { res.json(await svc.findAll()); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { res.json(await svc.create(req.body)); }
  catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try { res.json(await svc.updateRole(req.params.id, req.body.role)); }
  catch (err) { next(err); }
};

module.exports = { getAll, create, updateRole };

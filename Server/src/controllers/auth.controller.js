const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { user_name, password } = req.body;
    if (!user_name || !password)
      return res.status(400).json({ message: 'user_name and password are required.' });

    const data = await authService.login(user_name, password);
    res.json(data);
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const { user_name, full_name, email, password, department_id } = req.body;
    if (!user_name || !full_name || !email || !password)
      return res.status(400).json({ message: 'user_name, full_name, email, password are required.' });

    const employee = await authService.register({ user_name, full_name, email, password, department_id });
    res.status(201).json(employee);
  } catch (err) { next(err); }
};

// Returns the logged-in employee's info from the JWT
const me = (req, res) => {
  res.json(req.employee);
};

module.exports = { login, register, me };

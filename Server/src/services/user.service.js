const db = require('../config/db');
const bcrypt = require('bcryptjs');

const findAll = async () => {
  const [rows] = await db.query(`
    SELECT u.id, u.user_name, u.role, u.status, u.created_at, e.full_name, e.email, e.department_id
    FROM Users u
    JOIN Employee e ON u.employee_id = e.id
    ORDER BY u.created_at DESC
  `);
  return rows;
};

const create = async ({ user_name, full_name, email, password, role }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let employee_id;
    const [existingEmp] = await connection.query('SELECT id FROM Employee WHERE email = ?', [email]);
    if (existingEmp.length > 0) {
      employee_id = existingEmp[0].id;
    } else {
      const [empResult] = await connection.query('INSERT INTO Employee (full_name, email) VALUES (?, ?)', [full_name, email]);
      employee_id = empResult.insertId;
    }

    const hashed = await bcrypt.hash(password || 'Djezzy@123', 10);
    const [result] = await connection.query(
      'INSERT INTO Users (user_name, employee_id, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [user_name, employee_id, hashed, role || 'User', 'active']
    );

    await connection.commit();
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateRole = async (id, role) => {
  await db.query('UPDATE Users SET role = ? WHERE id = ?', [role, id]);
  return { message: 'Role updated successfully' };
};

module.exports = { findAll, create, updateRole };

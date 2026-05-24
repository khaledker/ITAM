require('dotenv').config();
const permissionService = require('./src/services/permission.service');
const db = require('./src/config/db');

async function test() {
  try {
    const employeeId = 8;
    const perms = await permissionService.getPermissions(employeeId);
    console.log('Employee 8 Permissions from DB:', perms);

    const userPerms = perms.permissions || [];
    console.log('userPerms:', userPerms);

    const effectivePerms = userPerms.length > 0
      ? [...new Set([...userPerms, 'consultation'])]
      : userPerms;
    console.log('effectivePerms:', effectivePerms);

    const required = ['consultation'];
    const hasAny = required.some(p => effectivePerms.includes(p));
    console.log('Has consultation:', hasAny);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

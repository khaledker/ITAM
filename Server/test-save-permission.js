require('dotenv').config();
const permissionService = require('./src/services/permission.service');

async function test() {
  try {
    const employeeId = 8;
    // Simulate what's received in req.body.permissions
    const bodyPerms = ['assignment'];
    await permissionService.setAll(employeeId, { permissions: bodyPerms, locationIds: [1, 2, 3, 4, 5] });
    
    const perms = await permissionService.getPermissions(employeeId);
    console.log('Saved Permissions:', perms);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

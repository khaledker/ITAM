require('dotenv').config({ path: '../../.env' });
const employeeService = require('../services/employee.service');
const assetService    = require('../services/asset.service');
const movementService = require('../services/movement.service');
const dashboardService = require('../services/dashboard.service');
const authService     = require('../services/auth.service');

async function runTests() {
  console.log('🚀 Starting Service Tests with Dummy Data...\n');

  try {
    // 1. Auth Test
    console.log('--- Testing Auth Service ---');
    const loginResult = await authService.login('admin.sys', 'Admin@1234');
    console.log('✅ Admin login successful. Token generated.');

    // 2. Employee Tests
    console.log('\n--- Testing Employee Service ---');
    const employees = await employeeService.findAll();
    console.log(`✅ findAll: Found ${employees.length} employees.`);
    
    const sofia = await employeeService.findById(3);
    console.log(`✅ findById(3): Found ${sofia.full_name} (${sofia.department_name})`);
    
    const assigned = await employeeService.getAssignedAssets(3);
    console.log(`✅ getAssignedAssets(3): Sofia has ${assigned.length} assets assigned.`);
    assigned.forEach(a => console.log(`   - ${a.tag}: ${a.model_name}`));

    // 3. Asset Tests
    console.log('\n--- Testing Asset Service ---');
    const assets = await assetService.findAll();
    console.log(`✅ findAll: Found ${assets.length} assets.`);
    
    const stats = await assetService.getStats();
    console.log(`✅ getStats: Total=${stats.total}, Available=${stats.available}, Assigned=${stats.assigned}`);
    
    const history = await assetService.getMovementHistory(1);
    console.log(`✅ getMovementHistory(1): Found ${history.length} movements for TAG-0001.`);

    // 4. Movement Tests
    console.log('\n--- Testing Movement Service ---');
    const movements = await movementService.findAll();
    console.log(`✅ findAll: Found ${movements.length} total movements.`);
    
    const drafts = await movementService.findAll({ status: 'Draft' });
    console.log(`✅ findAll(status=Draft): Found ${drafts.length} pending movements.`);
    
    const assignments = await movementService.findAll({ type: 'Assignment' });
    console.log(`✅ findAll(type=Assignment): Found ${assignments.length} assignments.`);

    // 5. Dashboard Tests
    console.log('\n--- Testing Dashboard Service ---');
    const dashStats = await dashboardService.getStats();
    console.log(`✅ getStats: ${dashStats.total} assets total.`);
    
    const recent = await dashboardService.getRecentMovements();
    console.log(`✅ getRecentMovements: Found ${recent.length} recent movements.`);
    
    const flagged = await dashboardService.getFlaggedAssets();
    console.log(`✅ getFlaggedAssets: Found ${flagged.length} assets requiring attention.`);
    flagged.forEach(f => console.log(`   - ${f.assetTag}: ${f.rule} (Risk: ${f.riskLevel})`));

    console.log('\n✨ All service functions tested successfully with dummy data!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit();
  }
}

runTests();

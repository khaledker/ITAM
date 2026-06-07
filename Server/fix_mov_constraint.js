const mysql = require('mysql2/promise');

async function fixMovementConstraint() {
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'mahdi',database:'itam'});
  try {
    // Drop the old constraint
    await c.query('ALTER TABLE AssetMovement DROP CHECK AssetMovement_chk_1');
    
    // Add the new constraint with 'Completed'
    await c.query("ALTER TABLE AssetMovement ADD CONSTRAINT AssetMovement_chk_1 CHECK (status IN ('Draft', 'Approved', 'Returned', 'Rejected', 'Completed'))");
    
    // Update the movement that was set to 'Returned'
    await c.query("UPDATE AssetMovement SET status = 'Completed' WHERE status = 'Returned' AND id IN (SELECT id FROM Transfer)");
    
    console.log('Constraint updated and movements fixed.');
  } catch (err) {
    console.error(err);
  } finally {
    await c.end();
  }
}

fixMovementConstraint();

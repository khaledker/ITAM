const fs = require('fs');
let code = fs.readFileSync('src/services/movement.service.js', 'utf8');

// replace the SELECT clause to fetch an array of assets
code = code.replace(
  'mv.id, mv.date, mv.status, mv.asset_id, mv.performed_by,\n      a.serial_number, a.tag,',
  'mv.id, mv.date, mv.status, mv.performed_by,\n      GROUP_CONCAT(a.id) AS asset_ids,\n      GROUP_CONCAT(a.serial_number) AS serial_numbers,'
);

code = code.replace(
  'JOIN Asset a ON mv.asset_id = a.id',
  'JOIN MovementItem mi ON mv.id = mi.movement_id\n    JOIN Asset a ON mi.asset_id = a.id'
);

code = code.replace(
  'WHERE mv.id = ?',
  'WHERE mv.id = ?\n    GROUP BY mv.id'
);

// note the original is @ORDER BY mv.date DESCL not GROUP BY in findAll...
code = code.replace(
  'ORDER BY mv.date DESC',
  'GROUP BY mv.id\n    ORDER BY mv.date DESC'
);

// fix insertions
code = code.replace(/const createReception = async \\{[\\s\\S]*?\\}) => \\{;m, 'const createReception = async ({ date, asset_ids, performed_by, purchase_order_number, receipt_number, supplier_id, destination_id }) => {');
code = code.replace(/const createAssignment = async \\{[\\s\\S]*?\\}) => \\{/m, 'const createAssignment = async ({ date, asset_ids, performed_by, expected_return, assigned_to, source_id }) => {');
code = code.replace(/const createTransfer = async \\{[\\s\\S]*?\\}) => \\{;m, 'const createTransfer = async ({ date, asset_ids, performed_by, reference, source_id, destination_id }) => {');
code = code.replace(/const createReturn = async \\{[\\s\\S]*?\\}) => \\{;m, 'const createReturn = async ({ date, asset_ids, performed_by, reason, returned_to }) => {');

// replace the INSERTs
const oldInsert1 = "const [mv] = await conn.query(\n      'INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES (?, ?, ?, ?)',\n      [date, 'Draft', asset_id, performed_by]\n    );\n    const movId = mv.insertId;";
const newInsert1 = "const [mv] = await conn.query(\n      'INSERT INTO AssetMovement (date, status, performed_by) VALUES (?, ?, ?)',\n      [date, 'Draft', performed_by]\n    );\n    const movId = mv.insertId;\n\n    for (const id of asset_ids) {\n      await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES (?, ?)', [movId, id]);\n    }";
code = code.replaceAll(oldInsert1, newInsert1);

// replace approve 
code = code.replace('mv.*, mv.asset_id,', 'mv.*, GROUP_CONCAT(mi.asset_id) AS asset_ids,');
code = code.replace('FROM AssetMovement mv', 'FROM AssetMovement mv\n      JOIN MovementItem mi ON mv.id = mi.movement_id');
code = code.replace('WHERE mv.id = ?', 'WHERE mv.id = ?\n      GROUP BY mv.id');

code = code.replace(/if \(newStatus === 'Approved'\) \\{[\\s\\S]*?\\} else if/m, (empts => `\if (newStatus === 'Approved') {
      const cVals = mv.asset_ids.includes(',') ? mv.asset_ids.split(',').map(Number) : [Number(mv.asset_ids)];
      if (mv.type === 'Reception') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ? WHERE id IN (?)',
          ['Available', mv.r_dest, cVals]
        );
      } else if (mv.type === 'Assignment') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ?, employee_id = ? WHERE id IN (?)',
          ['In Use', null, mv.assigned_to, cVals]
        );
      } else if (mv.type === 'Transfer') {
        await conn.query(
          'UPDATE Asset SET location_id = ? WHERE id IN (?)',
          [mv.t_dest, cVals]
        );
      } else if (mv.type === 'Return') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ?, employee_id = ? WHERE id IN (?)',
          ['Available', mv.returned_to, null, cVals]
        );
      }
    } else ifX));

fs.writeFileSync('src/services/movement.service.js', code);
console.log('done updating movement.service.js');
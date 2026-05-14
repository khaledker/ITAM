const fs = require('fs');
const path = require('path');

// Safe, idempotent updater for movement.service.js. It performs a small set
// of textual transforms to adapt single-asset movements into batch movements
// (MovementItem pivot). The script is conservative: it only replaces when
// expected substrings or patterns are present.

const svcPath = path.resolve(__dirname, 'src', 'services', 'movement.service.js');

if (!fs.existsSync(svcPath)) {
  console.error('movement.service.js not found at', svcPath);
  process.exit(1);
}

let code = fs.readFileSync(svcPath, 'utf8');

function safeReplace(search, replace) {
  if (code.includes(search)) {
    code = code.split(search).join(replace);
    return true;
  }
  return false;
}

// 1) Replace an obvious single-asset SELECT with GROUP_CONCAT version
safeReplace(
  "mv.id, mv.date, mv.status, mv.asset_id, mv.performed_by,\n      a.serial_number, a.tag,",
  "mv.id, mv.date, mv.status, mv.performed_by,\n      GROUP_CONCAT(a.id) AS asset_ids,\n      GROUP_CONCAT(a.serial_number) AS serial_numbers,"
);

// 2) Change JOIN from single-asset to MovementItem -> Asset
safeReplace(
  'JOIN Asset a ON mv.asset_id = a.id',
  'JOIN MovementItem mi ON mv.id = mi.movement_id\n    JOIN Asset a ON mi.asset_id = a.id'
);

// 3) Ensure GROUP BY when selecting by id
if (code.includes('WHERE mv.id = ?') && !code.includes('GROUP BY mv.id')) {
  code = code.replace('WHERE mv.id = ?', 'WHERE mv.id = ?\n    GROUP BY mv.id');
}

// 4) Ensure results are grouped before ORDER BY if necessary
if (code.includes('ORDER BY mv.date DESC') && !code.includes('GROUP BY mv.id')) {
  code = code.replace('ORDER BY mv.date DESC', 'GROUP BY mv.id\n    ORDER BY mv.date DESC');
}

// 5) Replace simple INSERT pattern that included asset_id into per-movement insert + MovementItem inserts
const insertPattern = "INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES";
if (code.includes(insertPattern)) {
  code = code.replace(
    "INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES",
    "INSERT INTO AssetMovement (date, status, performed_by) VALUES"
  );

  // After the INSERT we expect an immediate retrieval of insertId. We append a safe loop
  // that will insert MovementItem rows when asset_ids is provided.
  code = code.replace(/(const movId = mv.insertId;)/, `$1\n\n    if (Array.isArray(asset_ids) && asset_ids.length) {\n      for (const id of asset_ids) {\n        await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES (?, ?)', [movId, id]);\n      }\n    }`);
}

// 6) Replace any obvious references to mv.asset_id in selects to use GROUP_CONCAT(mi.asset_id)
safeReplace('mv.*, mv.asset_id,', 'mv.*, GROUP_CONCAT(mi.asset_id) AS asset_ids,');
safeReplace('FROM AssetMovement mv', 'FROM AssetMovement mv\n      JOIN MovementItem mi ON mv.id = mi.movement_id');

// 7) Patch approval branch to update assets in batch. We will add a small helper
// block that runs when newStatus === 'Approved' and mv.asset_ids is present.
if (code.includes("if (newStatus === 'Approved')") && !code.includes('/* batch-approve block */')) {
  const approvalInsert = `/* batch-approve block */\n    if (mv.asset_ids) {\n      const ids = String(mv.asset_ids).split(',').map(Number);\n      if (mv.type === 'Reception') {\n        await conn.query('UPDATE Asset SET status = ?, location_id = ? WHERE id IN (?)', ['Available', mv.r_dest, ids]);\n      } else if (mv.type === 'Assignment') {\n        await conn.query('UPDATE Asset SET status = ?, location_id = ?, employee_id = ? WHERE id IN (?)', ['In Use', null, mv.assigned_to, ids]);\n      } else if (mv.type === 'Transfer') {\n        await conn.query('UPDATE Asset SET location_id = ? WHERE id IN (?)', [mv.t_dest, ids]);\n      } else if (mv.type === 'Return') {\n        await conn.query('UPDATE Asset SET status = ?, location_id = ?, employee_id = ? WHERE id IN (?)', ['Available', mv.returned_to, null, ids]);\n      }\n    }\n`;

  // insert the helper right after the approval condition opening
  code = code.replace("if (newStatus === 'Approved') {", "if (newStatus === 'Approved') {\n    " + approvalInsert);
}

fs.writeFileSync(svcPath, code, 'utf8');
console.log('movement.service.js update complete');
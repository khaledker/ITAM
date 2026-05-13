const fs = require('fs');
let code = fs.readFileSync('Server/src/services/movement.service.js', 'utf8');

// replace asset_id with asset_ids in signatures
code = code.replace(/date, asset_id, performed_by,/g, 'date, asset_ids, performed_by,');

// replace AssetMovement INSERT
code = code.replace(
  /'INSERT INTO AssetMovement \(date, status, asset_id, performed_by\) VALUES \(\?, \?, \?, \?\)',\s*\[date, 'Draft', asset_id, performed_by\]/g,
  `'INSERT INTO AssetMovement (date, status, performed_by) VALUES (?, ?, ?)',
      [date, 'Draft', performed_by]`
);

// add MovementItem inserts after movId = mv.insertId;
code = code.replace(
  /const movId = mv\.insertId;/g,
  `const movId = mv.insertId;
    if (asset_ids && asset_ids.length > 0) {
      const itemValues = asset_ids.map(id => [movId, id]);
      await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES ?', [itemValues]);
    }`
);

// updateStatus mv.asset_id
code = code.replace('SELECT mv.*, mv.asset_id,', 'SELECT mv.*,');

// updateStatus query addition
code = code.replace(
  /const mv = mvRows\[0\];/g,
  `const mv = mvRows[0];
    const [itemRows] = await conn.query('SELECT asset_id FROM MovementItem WHERE movement_id = ?', [id]);
    const assetIds = itemRows.map(r => r.asset_id);`
);

// updateStatus WHERE id = ? to WHERE id IN (?)
code = code.replace(
  /if \(newStatus === 'Approved'\) \{/g,
  `if (newStatus === 'Approved' && assetIds.length > 0) {`
);
code = code.replace(/WHERE id = \?',\s*\['Available', mv\.r_dest, mv\.asset_id\]/g, "WHERE id IN (?)',\n          ['Available', mv.r_dest, assetIds]");
code = code.replace(/WHERE id = \?',\s*\['Assigned', mv\.assigned_to, mv\.asset_id\]/g, "WHERE id IN (?)',\n          ['Assigned', mv.assigned_to, assetIds]");
code = code.replace(/WHERE id = \?',\s*\[mv\.t_dest, mv\.asset_id\]/g, "WHERE id IN (?)',\n          [mv.t_dest, assetIds]");
code = code.replace(/WHERE id = \?',\s*\['Available', mv\.returned_to, mv\.asset_id\]/g, "WHERE id IN (?)',\n          ['Available', mv.returned_to, assetIds]");

fs.writeFileSync('Server/src/services/movement.service.js', code);
console.log('updated service');

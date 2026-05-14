const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, 'data.sql');
if (!fs.existsSync(dataPath)) {
  console.error('data.sql not found at', dataPath);
  process.exit(1);
}

let text = fs.readFileSync(dataPath, 'utf8');

// 1) Ensure MovementItem is truncated before AssetMovement during data reset
if (text.includes('TRUNCATE TABLE AssetMovement;') && !text.includes('TRUNCATE TABLE MovementItem;')) {
  text = text.replace('TRUNCATE TABLE AssetMovement;', 'TRUNCATE TABLE MovementItem;\nTRUNCATE TABLE AssetMovement;');
}

// 2) If there is no MovementItem insert block, append a conservative sample after existing inserts
if (!/INSERT INTO MovementItem/i.test(text)) {
  const appendBlock = `\n-- MovementItem pivot data (auto-inserted)\nINSERT INTO MovementItem (movement_id, asset_id) VALUES\n  (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 8),\n  (7, 1), (8, 2), (9, 7), (10, 3),\n  (11, 5), (12, 2);\n`;
  text = text + appendBlock;
}

fs.writeFileSync(dataPath, text, 'utf8');
console.log('data.sql updated (MovementItem block ensured)');

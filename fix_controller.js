const fs = require('fs');
let code = fs.readFileSync('Server/src/controllers/movement.controller.js', 'utf8');

code = code.replace(/asset_id/g, 'asset_ids');

fs.writeFileSync('Server/src/controllers/movement.controller.js', code);
console.log('updated controller');

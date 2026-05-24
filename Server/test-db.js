require('dotenv').config();
const db = require('./src/config/db');
async function test() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables:', tables);
    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [desc] = await db.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nTable: ${tableName}`);
      console.log(desc.map(c => `${c.Field}: ${c.Type}`).join('\n'));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

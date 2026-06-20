const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importDatabase() {
  console.log('🔄 Connecting to database...');
  
  // Connect without a specific database first to ensure the database exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  const dbName = process.env.DB_NAME || 'asset_management';
  console.log(`🔨 Recreating database: ${dbName}...`);
  
  await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
  await connection.query(`CREATE DATABASE \`${dbName}\`;`);
  await connection.query(`USE \`${dbName}\`;`);
  console.log(`✅ Database ${dbName} created.`);

  // Load schema.sql and data.sql
  const schemaPath = path.join(__dirname, '../../schema.sql');
  const dataPath = path.join(__dirname, '../../data.sql');

  let schemaSql = fs.readFileSync(schemaPath, 'utf8');
  let dataSql = fs.readFileSync(dataPath, 'utf8');

  // Remove database creation and "USE itam;" statements from the files to avoid writing to "itam" instead of "asset_management"
  schemaSql = schemaSql
    .replace(/DROP DATABASE IF EXISTS itam;/gi, '')
    .replace(/CREATE DATABASE itam;/gi, '')
    .replace(/USE itam;/gi, '');

  dataSql = dataSql
    .replace(/USE itam;/gi, '');

  console.log('📐 Applying schema.sql...');
  await connection.query(schemaSql);
  console.log('✅ schema.sql applied successfully.');

  console.log('💾 Seeding data.sql...');
  await connection.query(dataSql);
  console.log('✅ data.sql applied successfully.');

  await connection.end();
  console.log('🎉 Database seeding complete!');
}

importDatabase().catch(err => {
  console.error('❌ Failed to import database:', err.message);
  process.exit(1);
});

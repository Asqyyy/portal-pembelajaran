require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  try {
    console.log('Running migration...');
    const sqlPath = path.join(__dirname, '001_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Migration completed successfully! Seed data inserted.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();

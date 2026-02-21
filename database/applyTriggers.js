const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function applySQL(filePath) {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Applying SQL from ${filePath}...`);
        await pool.query(sql);
        console.log('✅ SQL applied successfully!');
    } catch (err) {
        console.error('❌ Error applying SQL:', err);
    } finally {
        await pool.end();
    }
}

const targetFile = process.argv[2] || path.join(__dirname, 'triggers.sql');
applySQL(targetFile);

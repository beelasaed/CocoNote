const { Pool } = require("pg");

// Direct connection setup (Bypassing .env for testing)
const pool = new Pool({
  user: "postgres",           // Your Postgres username
  password: "SalsabilSaed1234", // Your verified password
  host: "127.0.0.1",          // Using IP instead of 'localhost' is safer on Windows
  port: 5432,
  database: "CocoNoteDB",     // Your database name
});

// Test the connection immediately when the app starts
pool.connect((err, client, release) => {
  if (err) {
    console.error("________________________________________");
    console.error("🔴 DATABASE CONNECTION FAILED:", err.message);
    console.error("________________________________________");
  } else {
    console.log("________________________________________");
    console.log("🟢 SUCCESSFULLY CONNECTED TO POSTGRES!");
    console.log("________________________________________");
    release();
  }
});

module.exports = pool;
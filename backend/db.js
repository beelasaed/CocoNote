require("dotenv").config(); // loads variables from .env
const { Pool } = require("pg");

// create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST,      // e.g., localhost
  port: process.env.DB_PORT,      // e.g., 5432
  user: process.env.DB_USER,      // e.g., postgres
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,  // your CocoNote database
});

// optional: test connection immediately
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Connected to PostgreSQL database:", process.env.DB_NAME);
  release(); // release connection back to pool
});

module.exports = pool;

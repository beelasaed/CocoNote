const express = require('express');
const pool = require("./db"); 
const path = require('path');
const app = express();
const PORT = 3000;

// This tells Express to serve all your frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Main route to load index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
// test route
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "Connected to DB", time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});


app.listen(PORT, () => {
    console.log(`CocoNote is running at http://localhost:${PORT}`);
});
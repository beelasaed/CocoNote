const express = require('express');
const pool = require("./db"); 
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

// This tells Express to serve all your frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Simple query to match email and password
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password_hash = $2', 
            [email, password]
        );
        
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// DASHBOARD STATS ROUTE
app.get('/api/stats', async (req, res) => {
    try {
        // Calling your SQL Stored Procedures
        const contributors = await pool.query('SELECT * FROM get_top_contributors(5)');
        const topNotes = await pool.query('SELECT * FROM get_top_downloaded_notes(5)');
        
        res.json({
            topContributors: contributors.rows,
            popularNotes: topNotes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching stats" });
    }
});

// SIMPLIFIED UPLOAD ROUTE (No File Handling)
app.post('/api/upload', async (req, res) => {
    // We just take the text data. "file_link" is just a string (e.g., "google.com/mynote")
    const { title, course_id, category_id, uploader_id, file_link } = req.body;

    // If the user didn't provide a link, we create a fake one so the DB doesn't crash
    const finalPath = file_link || 'uploads/placeholder_note.pdf';

    try {
        await pool.query(
            'INSERT INTO note (title, course_id, category_id, uploader_id, file_path) VALUES ($1, $2, $3, $4, $5)',
            [title, course_id, category_id, uploader_id, finalPath]
        );
        res.json({ success: true, message: "Note info saved successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Database insert failed" });
    }
});

// FETCH NOTES ROUTE
app.get('/api/notes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT n.*, u.name as uploader_name, c.code as course_code 
            FROM note n
            JOIN users u ON n.uploader_id = u.user_id
            JOIN course c ON n.course_id = c.course_id
            ORDER BY n.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

// Main route (Explicit)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Catch-all route (MUST BE LAST)
// This says: "If the user asks for anything else not listed above, give them index.html"
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`CocoNote is running at http://localhost:${PORT}`);
});
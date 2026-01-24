const pool = require('../config/db');

// --- 1. Get Dropdown Options ---
exports.getUploadOptions = async (req, res) => {
    try {
        const departments = await pool.query('SELECT * FROM departments ORDER BY name ASC');
        const courses = await pool.query('SELECT * FROM course ORDER BY code ASC');
        const categories = await pool.query('SELECT * FROM category ORDER BY name ASC');

        res.json({
            departments: departments.rows,
            courses: courses.rows,
            categories: categories.rows
        });
    } catch (err) {
        console.error("Error fetching options:", err);
        res.status(500).json({ message: "Server Error fetching form options" });
    }
};

// --- 2. Upload Note (UPDATED: Uses Stored Procedure) ---
exports.uploadNote = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        const { title, description, batch, department_id, course_id, category_id } = req.body;
        const uploader_id = req.user.user_id; 
        const filePath = '/uploads/' + req.file.filename;

        // CALLING THE STORED PROCEDURE
        // Instead of writing "INSERT INTO...", we call the function we defined in procedures.sql
        const result = await pool.query(
            `SELECT * FROM upload_new_note($1, $2, $3, $4, $5, $6, $7, $8)`,
            [title, description, batch, department_id, course_id, category_id, uploader_id, filePath]
        );

        res.status(201).json({ 
            message: "Note uploaded successfully!", 
            note: result.rows[0] 
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Database Error: Could not save note." });
    }
};

// --- 3. Get All Notes for Feed (UPDATED: Uses View) ---
exports.getAllNotes = async (req, res) => {
    try {
        // SELECTING FROM THE VIEW
        // The complex JOIN logic is now hidden inside 'view_feed_details' (database/views.sql)
        //const query = `SELECT * FROM view_feed_details ORDER BY created_at DESC`;
        const user_id = req.user.user_id; // Get logged in user
        const query = `SELECT * FROM get_personalized_feed($1)`;
        const result = await pool.query(query, [user_id]);
        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).json({ message: "Server Error fetching feed" });
    }
};

// --- 4. Toggle Upvote ---
exports.toggleUpvote = async (req, res) => {
    try {
        const { note_id } = req.body;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ message: "note_id is required" });

        // Check if the note exists
        const noteCheck = await pool.query('SELECT uploader_id FROM note WHERE note_id = $1', [note_id]);
        if (noteCheck.rowCount === 0) {
            return res.status(400).json({ message: "Note does not exist" });
        }

        // Prevent upvoting your own note
        if (noteCheck.rows[0].uploader_id === user_id) {
            return res.status(400).json({ message: "You cannot upvote your own note." });
        }

        // Safe to toggle
        const result = await pool.query(`SELECT toggle_upvote($1, $2) AS action`, [user_id, note_id]);
            res.json({ message: result.rows[0].action }); //"ADDED" or "REMOVED"


    } catch (err) {
        console.error("Toggle Upvote Error:", err);
        res.status(500).json({ message: "Server error while toggling upvote" });
    }
};
// --- 5. Track Download ---
exports.trackDownload = async (req, res) => {
    try {
        const { note_id } = req.body;
        const user_id = req.user.user_id; // Ensure this matches your JWT payload structure

        if (!note_id) return res.status(400).json({ message: "note_id is required" });

        // Call the procedure
        const result = await pool.query(
            `SELECT track_download($1, $2) AS status`, 
            [user_id, note_id]
        );

        // We don't need to return data, just a 200 OK
        res.json({ message: result.rows[0].status });

    } catch (err) {
        console.error("Download Track Error:", err);
        // Don't block the actual download if tracking fails
        res.status(500).json({ message: "Tracking failed" });
    }
};

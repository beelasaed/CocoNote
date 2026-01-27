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
        const user_id = req.user.user_id;
        const { dept } = req.query; // Get ?dept= from the URL

        // We use 'null' if 'All' is selected to show everything
        const departmentFilter = (dept && dept !== 'All') ? dept : null;

        // Clean call to our new database function
        const query = `SELECT * FROM get_filtered_feed($1, $2)`;
        const result = await pool.query(query, [user_id, departmentFilter]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching filtered feed:", err);
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
        const user_id = req.user.user_id;

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

// 1. Safe Upvote (Returns JSON for your Toast Notification)
exports.toggleUpvoteAJAX = async (req, res) => {
    try {
        const { note_id } = req.body;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ success: false, message: "note_id is required" });

        // Check if note exists
        const noteCheck = await pool.query('SELECT uploader_id FROM note WHERE note_id = $1', [note_id]);
        if (noteCheck.rowCount === 0) {
            return res.status(400).json({ success: false, message: "Note does not exist" });
        }

        // Prevent upvoting own note
        if (noteCheck.rows[0].uploader_id === user_id) {
            return res.status(400).json({ success: false, message: "You cannot upvote your own note." });
        }

        // Toggle the vote using the stored procedure
        const result = await pool.query(`SELECT toggle_upvote($1, $2) AS action`, [user_id, note_id]);
        
        // Return clear JSON for your frontend
        return res.json({ 
            success: true, 
            message: result.rows[0].action === 'ADDED' ? "Upvoted successfully!" : "Upvote removed." 
        });

    } catch (err) {
        console.error("Toggle Upvote AJAX Error:", err);
        return res.status(500).json({ success: false, message: "Server error while toggling upvote" });
    }
};

// 2. Safe Download Tracking (Returns JSON so you can show Toast before downloading)
exports.trackDownloadAJAX = async (req, res) => {
    try {
        const { note_id } = req.body;
        const user_id = req.user.user_id; 

        if (!note_id) return res.status(400).json({ success: false, message: "note_id is required" });

        // Track the download
        const result = await pool.query(
            `SELECT track_download($1, $2) AS status`, 
            [user_id, note_id]
        );

        return res.json({ success: true, message: "Download started!" });

    } catch (err) {
        console.error("Download Track AJAX Error:", err);
        return res.status(500).json({ success: false, message: "Tracking failed" });
    }
};
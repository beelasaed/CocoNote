const pool = require('../config/db');

// --- Dropdown Options ---
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

// --- Upload Note ---
exports.uploadNote = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        const { title, description, batch, department_id, course_id, category_id } = req.body;
        const uploader_id = req.user.user_id;
        const filePath = '/uploads/' + req.file.filename;


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

// --- All Notes for Feed  ---
exports.getAllNotes = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { dept } = req.query;


        const departmentFilter = (dept && dept !== 'All') ? dept : null;


        const query = `SELECT * FROM get_filtered_feed($1, $2)`;
        const result = await pool.query(query, [user_id, departmentFilter]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching filtered feed:", err);
        res.status(500).json({ message: "Server Error fetching feed" });
    }
};

// --- Own Notes ---
exports.getUserNotes = async (req, res) => {
    try {
        const user_id = req.user.user_id;


        const result = await pool.query(`
            SELECT 
                n.note_id,
                n.title,
                n.description,
                n.batch,
                n.upvotes,
                n.downloads,
                n.created_at,
                c.name AS category,
                co.code AS course_code,
                co.name AS course,
                d.name AS department,
                u.name AS uploader,
                n.uploader_id
            FROM note n
            LEFT JOIN category c ON n.category_id = c.category_id
            LEFT JOIN course co ON n.course_id = co.course_id
            LEFT JOIN departments d ON n.department_id = d.department_id
            LEFT JOIN users u ON n.uploader_id = u.user_id
            WHERE n.uploader_id = $1
            ORDER BY n.created_at DESC
        `, [user_id]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user notes:", err);
        res.status(500).json({ message: "Server Error fetching user notes" });
    }
};

// --- 8. GET RECOMMENDATIONS ---
exports.getRecommendations = async (req, res) => {
    try {
        const user_id = req.user.user_id; // From authMiddleware

        // Call the stored function
        const result = await pool.query('SELECT * FROM get_user_recommendations($1)', [user_id]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching recommendations:", err);
        res.status(500).json({ message: "Server Error fetching recommendations" });
    }
};

// --- 9. GET RELATED NOTES (Item-Item) ---
exports.getRelatedNotes = async (req, res) => {
    try {
        const { note_id } = req.params;

        // Call the stored function
        const result = await pool.query('SELECT * FROM get_related_notes($1)', [note_id]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching related notes:", err);
        res.status(500).json({ message: "Server Error fetching related notes" });
    }
};


// --- Notes By Specific User (Public Profile) ---
exports.getNotesByUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) return res.status(400).json({ message: "User ID is required" });

        const result = await pool.query(`
            SELECT 
                n.note_id,
                n.title,
                n.description,
                n.batch,
                n.upvotes,
                n.downloads,
                n.created_at,
                c.name AS category,
                co.code AS course_code,
                co.name AS course,
                d.name AS department,
                u.name AS uploader,
                n.uploader_id
            FROM note n
            LEFT JOIN category c ON n.category_id = c.category_id
            LEFT JOIN course co ON n.course_id = co.course_id
            LEFT JOIN departments d ON n.department_id = d.department_id
            LEFT JOIN users u ON n.uploader_id = u.user_id
            WHERE n.uploader_id = $1
            ORDER BY n.created_at DESC
        `, [user_id]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching notes by user:", err);
        res.status(500).json({ message: "Server Error fetching notes by user" });
    }
};

// --- Get Note By ID ---
exports.getNoteById = async (req, res) => {
    try {
        const { note_id } = req.params;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ message: "note_id is required" });

        // Fetch the note with all related information
        const result = await pool.query(`
            SELECT 
                n.note_id,
                n.title,
                n.description,
                n.batch,
                n.upvotes,
                n.downloads,
                n.file_path,
                n.created_at,
                c.name AS category,
                co.code AS course_code,
                co.name AS course_name,
                d.name AS department,
                u.name AS uploader,
                u.user_id AS uploader_id,
                u.student_id,
                CASE WHEN EXISTS(SELECT 1 FROM upvote WHERE upvote.note_id = n.note_id AND upvote.user_id = $2) THEN true ELSE false END AS is_upvoted,
                COALESCE((SELECT AVG(rating)::numeric(3,1) FROM note_rating WHERE note_id = n.note_id), 0) AS average_rating,
                COALESCE((SELECT COUNT(*) FROM note_rating WHERE note_id = n.note_id), 0) AS rating_count,
                (SELECT rating FROM note_rating WHERE note_id = n.note_id AND user_id = $2) AS user_rating
            FROM note n
            LEFT JOIN category c ON n.category_id = c.category_id
            LEFT JOIN course co ON n.course_id = co.course_id
            LEFT JOIN departments d ON n.department_id = d.department_id
            LEFT JOIN users u ON n.uploader_id = u.user_id
            WHERE n.note_id = $1
        `, [note_id, user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching note:", err);
        res.status(500).json({ message: "Server Error fetching note details" });
    }
};

// --- Toggle Upvote ---
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
// --- Track Download ---
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


        res.json({ message: result.rows[0].status });

    } catch (err) {
        console.error("Download Track Error:", err);
        res.status(500).json({ message: "Tracking failed" });
    }
};

//  Safe Upvote 
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

        const note_uploader_id = noteCheck.rows[0].uploader_id;

        // Prevent upvoting own note
        if (note_uploader_id === user_id) {
            return res.status(400).json({ success: false, message: "You cannot upvote your own note." });
        }

        // Toggle the vote using the stored procedure
        const result = await pool.query(`SELECT toggle_upvote($1, $2) AS action`, [user_id, note_id]);
        const action = result.rows[0].action;

        // Create notification if upvote was added
        if (action === 'ADDED') {
            try {
                await pool.query(`
                    INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
                    VALUES ($1, $2, $3, 'upvote')
                `, [note_uploader_id, user_id, note_id]);
            } catch (notifErr) {
                console.error("Error creating notification:", notifErr);

            }
        }


        return res.json({
            success: true,
            message: action === 'ADDED' ? "Upvoted successfully!" : "Upvote removed."
        });

    } catch (err) {
        console.error("Toggle Upvote AJAX Error:", err);
        return res.status(500).json({ success: false, message: "Server error while toggling upvote" });
    }
};

// Safe Download Tracking 
exports.trackDownloadAJAX = async (req, res) => {
    try {
        const { note_id } = req.body;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ success: false, message: "note_id is required" });

        // Get note uploader before tracking
        const noteCheck = await pool.query('SELECT uploader_id FROM note WHERE note_id = $1', [note_id]);
        if (noteCheck.rowCount === 0) {
            return res.status(400).json({ success: false, message: "Note does not exist" });
        }

        const note_uploader_id = noteCheck.rows[0].uploader_id;

        // Track the download
        const result = await pool.query(
            `SELECT track_download($1, $2) AS status`,
            [user_id, note_id]
        );

        // Create notification if downloader is not the uploader
        if (user_id !== note_uploader_id) {
            try {
                await pool.query(`
                    INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
                    VALUES ($1, $2, $3, 'download')
                `, [note_uploader_id, user_id, note_id]);
            } catch (notifErr) {
                console.error("Error creating notification:", notifErr);
            }
        }

        return res.json({ success: true, message: "Download started!" });

    } catch (err) {
        console.error("Download Track AJAX Error:", err);
        return res.status(500).json({ success: false, message: "Tracking failed" });
    }
};

//GET UPVOTERS OF A NOTE
exports.getNoteUpvoters = async (req, res) => {
    try {
        const { note_id } = req.params;
        const user_id = req.user.user_id;

        if (!note_id) {
            return res.status(400).json({ message: "note_id is required" });
        }

        // Verify that the requesting user owns this note
        const noteCheck = await pool.query('SELECT uploader_id FROM note WHERE note_id = $1', [note_id]);
        if (noteCheck.rowCount === 0) {
            return res.status(404).json({ message: "Note not found" });
        }

        if (noteCheck.rows[0].uploader_id !== user_id) {
            return res.status(403).json({ message: "You can only view upvoters for your own notes" });
        }

        // Get all users who upvoted this note
        const result = await pool.query(`
            SELECT 
                u.user_id,
                u.name,
                u.batch,
                d.name AS department,
                COUNT(DISTINCT n.note_id) AS notes_uploaded,
                COALESCE(SUM(n.downloads), 0) AS total_downloads,
                COALESCE(SUM(n.upvotes), 0) AS total_upvotes
            FROM upvote uv
            LEFT JOIN users u ON uv.user_id = u.user_id
            LEFT JOIN departments d ON u.department_id = d.department_id
            LEFT JOIN note n ON n.uploader_id = u.user_id
            WHERE uv.note_id = $1
            GROUP BY u.user_id, u.name, u.batch, d.name
            ORDER BY u.name ASC
        `, [note_id]);

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching upvoters:", err);
        res.status(500).json({ message: "Server Error fetching upvoters" });
    }
};

// --- SAVE NOTE ---
exports.saveNote = async (req, res) => {
    try {
        const { note_id } = req.params;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ success: false, message: "note_id is required" });

        // Check if note exists
        const noteCheck = await pool.query('SELECT uploader_id FROM note WHERE note_id = $1', [note_id]);
        if (noteCheck.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        const note_uploader_id = noteCheck.rows[0].uploader_id;

        // Check if already saved
        const alreadySaved = await pool.query(
            'SELECT * FROM saved_note WHERE user_id = $1 AND note_id = $2',
            [user_id, note_id]
        );

        if (alreadySaved.rowCount > 0) {
            return res.status(400).json({ success: false, message: "Note already saved" });
        }

        // Save the note
        await pool.query(
            'INSERT INTO saved_note (user_id, note_id) VALUES ($1, $2)',
            [user_id, note_id]
        );

        // Create notification for uploader (if not saving own note)
        if (user_id !== note_uploader_id) {
            try {
                await pool.query(`
                    INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
                    VALUES ($1, $2, $3, 'save')
                `, [note_uploader_id, user_id, note_id]);
            } catch (notifErr) {
                console.error("Error creating notification:", notifErr);
            }
        }

        res.json({ success: true, message: "Note saved successfully!" });

    } catch (err) {
        console.error("Save Note Error:", err);
        res.status(500).json({ success: false, message: "Server error while saving note" });
    }
};

// --- UNSAVE NOTE ---
exports.unsaveNote = async (req, res) => {
    try {
        const { note_id } = req.params;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ success: false, message: "note_id is required" });

        const result = await pool.query(
            'DELETE FROM saved_note WHERE user_id = $1 AND note_id = $2 RETURNING saved_note_id',
            [user_id, note_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Saved note not found" });
        }

        res.json({ success: true, message: "Note unsaved successfully!" });

    } catch (err) {
        console.error("Unsave Note Error:", err);
        res.status(500).json({ success: false, message: "Server error while unsaving note" });
    }
};

// --- GET SAVED NOTES ---
exports.getSavedNotes = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const result = await pool.query(`
            SELECT 
                n.note_id,
                n.title,
                n.description,
                n.batch,
                n.upvotes,
                n.downloads,
                n.created_at,
                c.name AS category,
                co.code AS course_code,
                co.name AS course,
                d.name AS department,
                u.name AS uploader,
                n.uploader_id,
                sn.saved_at
            FROM saved_note sn
            INNER JOIN note n ON sn.note_id = n.note_id
            LEFT JOIN category c ON n.category_id = c.category_id
            LEFT JOIN course co ON n.course_id = co.course_id
            LEFT JOIN departments d ON n.department_id = d.department_id
            LEFT JOIN users u ON n.uploader_id = u.user_id
            WHERE sn.user_id = $1
            ORDER BY sn.saved_at DESC
        `, [user_id]);

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching saved notes:", err);
        res.status(500).json({ message: "Server Error fetching saved notes" });
    }
};

// --- CHECK IF NOTE IS SAVED ---
exports.checkIfNoteSaved = async (req, res) => {
    try {
        const { note_id } = req.params;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ message: "note_id is required" });

        const result = await pool.query(
            'SELECT * FROM saved_note WHERE user_id = $1 AND note_id = $2',
            [user_id, note_id]
        );

        res.json({ is_saved: result.rowCount > 0 });

    } catch (err) {
        console.error("Error checking saved status:", err);
        res.status(500).json({ message: "Server Error checking saved status" });
    }
};

// --- GET ANALYTICS ---
exports.getAnalytics = async (req, res) => {
    try {
        const topContributorsQuery = `
            SELECT u.user_id, u.name, COUNT(n.note_id) as note_count
            FROM note n
            JOIN users u ON n.uploader_id = u.user_id
            GROUP BY u.user_id, u.name
            ORDER BY note_count DESC
            LIMIT 3
        `;

        const mostDownloadedQuery = `
            SELECT note_id, title, downloads, file_path
            FROM note
            WHERE downloads > 0
            ORDER BY downloads DESC
            LIMIT 3
        `;

        const deptActivityQuery = `
            SELECT d.name, COUNT(n.note_id) as note_count
            FROM note n
            JOIN departments d ON n.department_id = d.department_id
            GROUP BY d.department_id, d.name
            ORDER BY note_count DESC
        `;

        const courseStatsQuery = `
            SELECT c.name, COUNT(n.note_id) as note_count
            FROM note n
            JOIN course c ON n.course_id = c.course_id
            GROUP BY c.course_id, c.name
            ORDER BY note_count DESC
            LIMIT 3
        `;

        const [topContributors, mostDownloaded, deptActivity, courseStats] = await Promise.all([
            pool.query(topContributorsQuery),
            pool.query(mostDownloadedQuery),
            pool.query(deptActivityQuery),
            pool.query(courseStatsQuery)
        ]);

        res.json({
            topContributors: topContributors.rows,
            mostDownloaded: mostDownloaded.rows,
            deptActivity: deptActivity.rows,
            courseStats: courseStats.rows
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ message: "Server Error fetching analytics" });
    }
};

// --- SUBMIT RATING ---
exports.submitRating = async (req, res) => {
    try {
        const { note_id } = req.params;
        const { rating } = req.body;
        const user_id = req.user.user_id;

        if (!note_id) return res.status(400).json({ success: false, message: "note_id is required" });
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        // Check if note exists
        const noteCheck = await pool.query('SELECT uploader_id FROM note WHERE note_id = $1', [note_id]);
        if (noteCheck.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        const note_uploader_id = noteCheck.rows[0].uploader_id;

        // Prevent rating own note
        if (note_uploader_id === user_id) {
            return res.status(400).json({ success: false, message: "You cannot rate your own note" });
        }

        // Upsert rating (update if exists, else insert)
        await pool.query(`
            INSERT INTO note_rating (note_id, user_id, rating)
            VALUES ($1, $2, $3)
            ON CONFLICT (note_id, user_id) DO UPDATE 
            SET rating = EXCLUDED.rating, rated_at = NOW()
        `, [note_id, user_id, rating]);

        res.json({ success: true, message: "Rating submitted successfully!" });

    } catch (err) {
        console.error("Submit Rating Error:", err);
        res.status(500).json({ success: false, message: "Server error while submitting rating" });
    }
};

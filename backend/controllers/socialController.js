const pool = require('../config/db');

// --- Toggle Star (Follow) ---
exports.toggleStar = async (req, res) => {
    try {
        const { target_id, target_type } = req.body;
        const user_id = req.user.user_id;

        if (!target_id || !target_type) {
            return res.status(400).json({ success: false, message: "target_id and target_type are required" });
        }

        if (!['user', 'course'].includes(target_type)) {
            return res.status(400).json({ success: false, message: "Invalid target_type" });
        }

        // Prevent starring self
        if (target_type === 'user' && parseInt(target_id) === user_id) {
            return res.status(400).json({ success: false, message: "You cannot star yourself" });
        }

        // Check if already starred
        const check = await pool.query(
            'SELECT * FROM stars WHERE user_id = $1 AND target_id = $2 AND target_type = $3',
            [user_id, target_id, target_type]
        );

        if (check.rowCount > 0) {
            // Unstar
            await pool.query(
                'DELETE FROM stars WHERE user_id = $1 AND target_id = $2 AND target_type = $3',
                [user_id, target_id, target_type]
            );
            return res.json({ success: true, action: 'UNSTARRED', message: "Removed star" });
        } else {
            // Star
            await pool.query(
                'INSERT INTO stars (user_id, target_id, target_type) VALUES ($1, $2, $3)',
                [user_id, target_id, target_type]
            );
            return res.json({ success: true, action: 'STARRED', message: "Starred successfully!" });
        }

    } catch (err) {
        console.error("Toggle Star Error:", err);
        res.status(500).json({ success: false, message: "Server error while toggling star" });
    }
};

// --- Check Star Status ---
exports.getStarStatus = async (req, res) => {
    try {
        const { target_id, target_type } = req.query;
        const user_id = req.user.user_id;

        if (!target_id || !target_type) {
            return res.status(400).json({ success: false, message: "target_id and target_type are required" });
        }

        const result = await pool.query(
            'SELECT 1 FROM stars WHERE user_id = $1 AND target_id = $2 AND target_type = $3',
            [user_id, target_id, target_type]
        );

        res.json({ is_starred: result.rowCount > 0 });

    } catch (err) {
        console.error("Get Star Status Error:", err);
        res.status(500).json({ success: false, message: "Server error checking star status" });
    }
};

// --- Get Starred Entities ---
exports.getStarred = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { type } = req.query; // 'user' or 'course'

        let result;
        if (type === 'user') {
            result = await pool.query(`
                SELECT u.user_id, u.name, u.profile_picture, d.name as department
                FROM stars s
                JOIN users u ON s.target_id = u.user_id
                LEFT JOIN departments d ON u.department_id = d.department_id
                WHERE s.user_id = $1 AND s.target_type = 'user'
            `, [user_id]);
        } else if (type === 'course') {
            result = await pool.query(`
                SELECT c.course_id, c.name, c.code
                FROM stars s
                JOIN course c ON s.target_id = c.course_id
                WHERE s.user_id = $1 AND s.target_type = 'course'
            `, [user_id]);
        } else {
            return res.status(400).json({ message: "Invalid type" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error("Get Starred Error:", err);
        res.status(500).json({ message: "Server error fetching starred items" });
    }
};

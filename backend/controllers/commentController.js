const pool = require('../config/db');

// --- Post Comment ---
exports.postComment = async (req, res) => {
    try {
        const { note_id } = req.params;
        const { content, parent_comment_id } = req.body;
        const user_id = req.user.user_id;

        if (!content) return res.status(400).json({ success: false, message: "Comment content is required" });

        const result = await pool.query(
            `INSERT INTO comment (note_id, user_id, content, parent_comment_id) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [note_id, user_id, content, parent_comment_id || null]
        );

        res.status(201).json({
            success: true,
            message: "Comment posted successfully!",
            comment: result.rows[0]
        });
    } catch (err) {
        console.error("Post Comment Error:", err);
        res.status(500).json({ success: false, message: "Server error while posting comment" });
    }
};

// --- Get Comments for a Note ---
exports.getCommentsByNote = async (req, res) => {
    try {
        const { note_id } = req.params;
        const user_id = req.user.user_id;

        const result = await pool.query(`
            SELECT 
                c.*, 
                u.name as user_name,
                u.profile_picture,
                (SELECT vote_type FROM comment_vote WHERE comment_id = c.comment_id AND user_id = $2) AS user_vote
            FROM comment c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.note_id = $1
            ORDER BY c.created_at ASC
        `, [note_id, user_id]);

        res.json({ success: true, comments: result.rows });
    } catch (err) {
        console.error("Get Comments Error:", err);
        res.status(500).json({ success: false, message: "Server error while fetching comments" });
    }
};

// --- Edit Comment ---
exports.editComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { content } = req.body;
        const user_id = req.user.user_id;

        if (!content) return res.status(400).json({ success: false, message: "Content is required" });

        const result = await pool.query(
            `UPDATE comment 
             SET content = $1, updated_at = NOW() 
             WHERE comment_id = $2 AND user_id = $3 
             RETURNING *`,
            [content, comment_id, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or comment not found" });
        }

        res.json({ success: true, message: "Comment updated!", comment: result.rows[0] });
    } catch (err) {
        console.error("Edit Comment Error:", err);
        res.status(500).json({ success: false, message: "Server error while updating comment" });
    }
};

// --- Delete Comment ---
exports.deleteComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const user_id = req.user.user_id;

        const result = await pool.query(
            "DELETE FROM comment WHERE comment_id = $1 AND user_id = $2 RETURNING *",
            [comment_id, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or comment not found" });
        }

        res.json({ success: true, message: "Comment deleted!" });
    } catch (err) {
        console.error("Delete Comment Error:", err);
        res.status(500).json({ success: false, message: "Server error while deleting comment" });
    }
};

// --- Vote Comment ---
exports.voteComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { vote_type } = req.body; // 1 or -1
        const user_id = req.user.user_id;

        if (![1, -1].includes(vote_type)) {
            return res.status(400).json({ success: false, message: "Invalid vote type" });
        }

        await pool.query(`
            INSERT INTO comment_vote (comment_id, user_id, vote_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (comment_id, user_id) DO UPDATE 
            SET vote_type = EXCLUDED.vote_type
        `, [comment_id, user_id, vote_type]);

        res.json({ success: true, message: "Vote recorded!" });
    } catch (err) {
        console.error("Vote Comment Error:", err);
        res.status(500).json({ success: false, message: "Server error while voting" });
    }
};

// --- Toggle Notification Preference ---
exports.toggleNotificationPreference = async (req, res) => {
    try {
        const { note_id } = req.params;
        const { receive_notifications } = req.body;
        const user_id = req.user.user_id;

        await pool.query(`
            INSERT INTO note_notification_preference (user_id, note_id, receive_notifications)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, note_id) DO UPDATE 
            SET receive_notifications = EXCLUDED.receive_notifications
        `, [user_id, note_id, receive_notifications]);

        res.json({ success: true, message: "Preference updated!" });
    } catch (err) {
        console.error("Toggle Notif Pref Error:", err);
        res.status(500).json({ success: false, message: "Server error while updating preferences" });
    }
};

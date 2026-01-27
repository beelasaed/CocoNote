const pool = require('../config/db'); // Ensure you have a db.js file or use your connection here
const bcrypt = require('bcryptjs'); // Make sure to npm install bcryptjs
const jwt = require('jsonwebtoken');

// --- 1. REGISTER USER ---
exports.registerUser = async (req, res) => {
    const { name, student_id, email, department_id, batch, password } = req.body;

    try {
        // Step 0: Check Email Domain
        if (!email.endsWith('@iut-dhaka.edu')) {
            return res.status(400).json({ message: "Only @iut-dhaka.edu emails are allowed." });
        }

        // Step A: Check if Student ID is allowed (in valid_student_ids table)
        const idCheck = await pool.query('SELECT * FROM valid_student_ids WHERE student_id = $1', [student_id]);
        if (idCheck.rows.length === 0) {
            return res.status(401).json({ message: "Student ID not found in official records." });
        }

        // Step B: Check if Email is already used
        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered." });
        }

        // Step C: Hash the Password (Security)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Step D: Insert User into Database
        // NOTICE: We removed 'role' from this query!
        const newUser = await pool.query(
            `INSERT INTO users (name, student_id, email, password, department_id, batch) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, student_id, email, hashedPassword, department_id, batch]
        );

        // Step E: Generate Token
        const token = jwt.sign({ user_id: newUser.rows[0].user_id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

        res.json({ message: "Registration Successful!", token, user: newUser.rows[0] });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server Error during registration" });
    }
};

// --- 2. LOGIN USER ---
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Step 0: Check Email Domain (Strict measure)
        if (!email.endsWith('@iut-dhaka.edu')) {
            return res.status(400).json({ message: "Only @iut-dhaka.edu emails are allowed." });
        }

        // Step A: Find user by Email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // Step B: Compare Password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        // Step C: Generate Token
        const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

        // We can just assume they are a student in the response
        res.json({
            message: "Login Successful",
            token,
            user: { ...user, role: 'student' }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server Error during login" });
    }
};

// --- 3. GET DEPARTMENTS (For the Dropdown) ---
exports.getDepartments = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM departments');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching departments:", err);
        res.status(500).json({ message: "Failed to load departments" });
    }
};

// --- 4. GET CURRENT USER PROFILE ---
exports.getCurrentUser = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        // Get user info with department name
        const userResult = await pool.query(`
            SELECT 
                u.user_id,
                u.name,
                u.student_id,
                u.email,
                u.batch,
                u.total_points,
                u.created_at,
                d.name AS department
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE u.user_id = $1
        `, [user_id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // Get user statistics
        const statsResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT n.note_id) AS notes_uploaded,
                COALESCE(SUM(n.downloads), 0) AS total_downloads,
                COALESCE(SUM(n.upvotes), 0) AS total_upvotes
            FROM note n
            WHERE n.uploader_id = $1
        `, [user_id]);

        const stats = statsResult.rows[0];

        res.json({
            ...user,
            notes_uploaded: parseInt(stats.notes_uploaded),
            total_downloads: parseInt(stats.total_downloads),
            total_upvotes: parseInt(stats.total_upvotes)
        });

    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ message: "Server Error fetching profile" });
    }
};

// --- 5. GET NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        // Fetch notifications with actor user info and note title
        const result = await pool.query(`
            SELECT 
                notif.notification_id,
                notif.action_type,
                notif.is_read,
                notif.created_at,
                u.name AS actor_name,
                u.student_id,
                n.title AS note_title,
                n.note_id
            FROM notification notif
            LEFT JOIN users u ON notif.actor_user_id = u.user_id
            LEFT JOIN note n ON notif.note_id = n.note_id
            WHERE notif.recipient_user_id = $1
            ORDER BY notif.created_at DESC
            LIMIT 50
        `, [user_id]);

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Server Error fetching notifications" });
    }
};

// --- 6. MARK NOTIFICATION AS READ ---
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notification_id } = req.body;
        const user_id = req.user.user_id;

        // Update notification (verify it belongs to the user)
        const result = await pool.query(`
            UPDATE notification 
            SET is_read = true 
            WHERE notification_id = $1 AND recipient_user_id = $2
            RETURNING *
        `, [notification_id, user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification marked as read", notification: result.rows[0] });

    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ message: "Server Error updating notification" });
    }
};

// --- 7. GET UNREAD COUNT ---
exports.getUnreadCount = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const result = await pool.query(`
            SELECT COUNT(*) AS unread_count
            FROM notification
            WHERE recipient_user_id = $1 AND is_read = false
        `, [user_id]);

        res.json({ unread_count: parseInt(result.rows[0].unread_count) });

    } catch (err) {
        console.error("Error fetching unread count:", err);
        res.status(500).json({ message: "Server Error fetching unread count" });
    }
};

// --- 8. GET PUBLIC USER PROFILE (Limited Info) ---
exports.getPublicUserProfile = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ message: "user_id is required" });
        }

        // Get user info with department name (NO email or personal info)
        const userResult = await pool.query(`
            SELECT 
                u.user_id,
                u.name,
                u.batch,
                u.created_at,
                d.name AS department
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE u.user_id = $1
        `, [user_id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // Get user statistics
        const statsResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT n.note_id) AS notes_uploaded,
                COALESCE(SUM(n.downloads), 0) AS total_downloads,
                COALESCE(SUM(n.upvotes), 0) AS total_upvotes
            FROM note n
            WHERE n.uploader_id = $1
        `, [user_id]);

        const stats = statsResult.rows[0];

        res.json({
            ...user,
            notes_uploaded: parseInt(stats.notes_uploaded),
            total_downloads: parseInt(stats.total_downloads),
            total_upvotes: parseInt(stats.total_upvotes)
        });

    } catch (err) {
        console.error("Error fetching public user profile:", err);
        res.status(500).json({ message: "Server Error fetching user profile" });
    }
};

// --- 9. GET LEADERBOARD (Based on Upvotes + Downloads) ---
exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id,
                u.name,
                u.batch,
                d.name AS department,
                COUNT(DISTINCT n.note_id) AS notes_uploaded,
                COALESCE(SUM(n.downloads), 0) AS total_downloads,
                COALESCE(SUM(n.upvotes), 0) AS total_upvotes,
                (COALESCE(SUM(n.downloads), 0) + COALESCE(SUM(n.upvotes), 0)) AS total_score
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.department_id
            LEFT JOIN note n ON n.uploader_id = u.user_id
            GROUP BY u.user_id, u.name, u.batch, d.name
            HAVING COUNT(DISTINCT n.note_id) > 0
            ORDER BY total_score DESC
            LIMIT 100
        `);

        // Add rank numbers
        const leaderboard = result.rows.map((row, index) => ({
            ...row,
            rank: index + 1,
            notes_uploaded: parseInt(row.notes_uploaded),
            total_downloads: parseInt(row.total_downloads),
            total_upvotes: parseInt(row.total_upvotes),
            total_score: parseInt(row.total_score)
        }));

        res.json(leaderboard);

    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ message: "Server Error fetching leaderboard" });
    }
};
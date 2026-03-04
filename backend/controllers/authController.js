const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- PASSWORD VALIDATION ---
function validatePassword(password) {
    const errors = [];
    
    if (!password || password.length < 5) {
        errors.push('Password must be at least 5 characters long');
    }
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return errors;
}

// --- REGISTER USER ---
exports.registerUser = async (req, res) => {
    const { name, student_id, email, department_id, password } = req.body;

    try {
        if (!JWT_SECRET) {
            return res.status(500).json({ message: 'Server auth configuration error' });
        }

        // Validate Student ID: 9 digits, numeric
        if (!/^\d{9}$/.test(student_id)) {
            return res.status(400).json({ message: "Invalid Student ID format. It must be 9 digits long." });
        }

        const batch = parseInt(student_id.substring(0, 2));
        if (batch < 12 || batch > 24) {
            return res.status(400).json({ message: "Invalid Student ID. Batch extracted must be between 12 and 24." });
        }

        if (!email.endsWith('@iut-dhaka.edu')) {
            return res.status(400).json({ message: "Only @iut-dhaka.edu emails are allowed." });
        }

        // Validate password
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ message: passwordErrors.join(' ') });
        }

        const idCheck = await pool.query('SELECT * FROM valid_student_ids WHERE student_id = $1', [student_id]);
        if (idCheck.rows.length === 0) {
            return res.status(401).json({ message: "Student ID not found in official records." });
        }


        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered." });
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const newUser = await pool.query(
            `INSERT INTO users (name, student_id, email, password, department_id, batch) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, student_id, email, hashedPassword, department_id, batch]
        );


        const token = jwt.sign({ user_id: newUser.rows[0].user_id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

        res.json({ message: "Registration Successful!", token, user: newUser.rows[0] });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server Error during registration" });
    }
};

// --- LOGIN USER ---
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!JWT_SECRET) {
            return res.status(500).json({ message: 'Server auth configuration error' });
        }

        if (!email.endsWith('@iut-dhaka.edu')) {
            return res.status(400).json({ message: "Only @iut-dhaka.edu emails are allowed." });
        }


        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // Check if password exists (user may have signed up with Google)
        if (!user.password) {
            return res.status(401).json({ message: "This account was created with Google Sign-up. Please use Google to login." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid Password" });
        }


        const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });


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

// ---- GET DEPARTMENTS (For the Dropdown) ---
exports.getDepartments = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM departments');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching departments:", err);
        res.status(500).json({ message: "Failed to load departments" });
    }
};

// ---- GET CURRENT USER PROFILE ---
// ---- GET CURRENT USER PROFILE ---
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
                u.bio,
                u.profile_picture,
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

        // Get user statistics from optimized view
        const statsResult = await pool.query(`
            SELECT 
                notes_uploaded,
                total_downloads,
                total_upvotes,
                follower_count,
                following_count
            FROM user_stats
            WHERE user_id = $1
        `, [user_id]);

        const stats = statsResult.rows[0];

        // Get earned badges
        const badgesResult = await pool.query(`
            SELECT b.name, b.description, ub.earned_at
            FROM user_badge ub
            JOIN badge b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = $1
            ORDER BY ub.earned_at DESC
        `, [user_id]);

        res.json({
            ...user,
            notes_uploaded: parseInt(stats.notes_uploaded),
            total_downloads: parseInt(stats.total_downloads),
            total_upvotes: parseInt(stats.total_upvotes),
            follower_count: parseInt(stats.follower_count),
            following_count: parseInt(stats.following_count),
            badges: badgesResult.rows
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
                n.note_id,
                notif.actor_user_id
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
                u.bio,
                u.profile_picture,
                u.created_at,
                u.total_points, -- Added total_points
                d.name AS department
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE u.user_id = $1
        `, [user_id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // Get user statistics from optimized view
        const statsResult = await pool.query(`
            SELECT 
                notes_uploaded,
                total_downloads,
                total_upvotes,
                follower_count,
                following_count
            FROM user_stats
            WHERE user_id = $1
        `, [user_id]);

        const stats = statsResult.rows[0];

        // Get earned badges
        const badgesResult = await pool.query(`
            SELECT b.name, b.description, ub.earned_at
            FROM user_badge ub
            JOIN badge b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = $1
            ORDER BY ub.earned_at DESC
        `, [user_id]);

        res.json({
            ...user,
            notes_uploaded: parseInt(stats.notes_uploaded),
            total_downloads: parseInt(stats.total_downloads),
            total_upvotes: parseInt(stats.total_upvotes),
            follower_count: parseInt(stats.follower_count),
            following_count: parseInt(stats.following_count),
            badges: badgesResult.rows
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
                u.total_points, -- Use total_points directly
                d.name AS department,
                COUNT(DISTINCT n.note_id) AS notes_uploaded,
                COALESCE(SUM(n.downloads), 0) AS total_downloads,
                COALESCE(SUM(n.upvotes), 0) AS total_upvotes
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.department_id
            LEFT JOIN note n ON n.uploader_id = u.user_id
            GROUP BY u.user_id, u.name, u.batch, u.total_points, d.name
            HAVING COUNT(DISTINCT n.note_id) > 0
            ORDER BY u.total_points DESC
            LIMIT 100
        `);

        // Add rank numbers
        const leaderboard = result.rows.map((row, index) => ({
            ...row,
            rank: index + 1,
            notes_uploaded: parseInt(row.notes_uploaded),
            total_downloads: parseInt(row.total_downloads),
            total_upvotes: parseInt(row.total_upvotes),
            total_score: parseInt(row.total_points) // Map total_points to total_score for frontend compat or use total_points directly
        }));

        res.json(leaderboard);

    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ message: "Server Error fetching leaderboard" });
    }
};

// --- 10. MARK NOTIFICATION AS READ ---
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notification_id } = req.body;
        const user_id = req.user.user_id;

        await pool.query(`
            UPDATE notification 
            SET is_read = TRUE 
            WHERE notification_id = $1 AND recipient_user_id = $2
        `, [notification_id, user_id]);

        res.json({ message: "Notification marked as read" });

    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ message: "Server Error marking notification read" });
    }
};

// --- 11. DELETE NOTIFICATION ---
exports.deleteNotification = async (req, res) => {
    try {
        const { notification_id } = req.body;
        const user_id = req.user.user_id;

        const result = await pool.query(`
            DELETE FROM notification 
            WHERE notification_id = $1 AND recipient_user_id = $2
            RETURNING notification_id
        `, [notification_id, user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification deleted", notification_id });

    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).json({ message: "Server Error deleting notification" });
    }
};

// --- 11. DELETE ALL NOTIFICATIONS ---
exports.deleteAllNotifications = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const result = await pool.query(`
            DELETE FROM notification 
            WHERE recipient_user_id = $1
            RETURNING notification_id
        `, [user_id]);

        res.json({
            message: "All notifications deleted",
            deleted_count: result.rowCount
        });

    } catch (err) {
        console.error("Error deleting all notifications:", err);
        res.status(500).json({ message: "Server Error deleting notifications" });
    }
};

// --- 12. UPDATE PROFILE ---
exports.updateProfile = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { name, bio } = req.body;
        let profile_picture = req.file ? `/uploads/${req.file.filename}` : undefined;

        // Build the update query dynamically to avoid overwriting with undefined
        let query = 'UPDATE users SET ';
        let params = [];
        let count = 1;

        if (name) {
            query += `name = $${count}, `;
            params.push(name);
            count++;
        }
        if (bio !== undefined) {
            query += `bio = $${count}, `;
            params.push(bio);
            count++;
        }
        if (profile_picture) {
            query += `profile_picture = $${count}, `;
            params.push(profile_picture);
            count++;
        }

        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ` WHERE user_id = $${count} RETURNING *`;
        params.push(user_id);

        if (params.length === 1) {
            return res.status(400).json({ message: "No fields to update" });
        }

        const result = await pool.query(query, params);

        res.json({
            message: "Profile updated successfully",
            user: result.rows[0]
        });

    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({
            message: "Server Error updating profile",
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// --- 13. DELETE USER ---
exports.deleteUser = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        // Note: Cascading deletes should handle notes, notifications, downloads, upvotes, etc.
        // as configured in the DB schema.
        const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Account deleted successfully" });

    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Server Error deleting account" });
    }
};

// --- GOOGLE AUTH ---
exports.googleAuth = async (req, res) => {
    const { credential } = req.body;
    console.log("DEBUG: googleAuth called");

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;
        console.log(`DEBUG: googleAuth verified email: ${email}`);

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });

            return res.json({
                success: true,
                isNewUser: false,
                token,
                user: { ...user, role: 'student' }
            });
        } else {
            // New User: Send back info for supplementary registration
            return res.json({
                success: true,
                isNewUser: true,
                googleData: { email, name }
            });
        }

    } catch (err) {
        console.error("Google Auth Error Details:", err);
        res.status(500).json({ message: "Google Authentication failed" });
    }
};

// --- GOOGLE SUPPLEMENTARY REGISTER ---
exports.googleRegister = async (req, res) => {
    console.log("DEBUG: googleRegister req.body:", req.body);
    const { name, email, student_id, department_id } = req.body;

    try {
        // Validation
        if (!/^\d{9}$/.test(student_id)) {
            return res.status(400).json({ message: "Invalid Student ID format." });
        }

        const batch = parseInt(student_id.substring(0, 2));
        console.log(`DEBUG: Registering user: ${email}, ID: ${student_id}, Dept: ${department_id}, Batch: ${batch}`);

        const idCheck = await pool.query('SELECT * FROM valid_student_ids WHERE student_id = $1', [student_id]);
        if (idCheck.rows.length === 0) {
            return res.status(401).json({ message: "Student ID not found in official records." });
        }

        // Create User (No password for Google users)
        const sql = `INSERT INTO users (name, student_id, email, password, department_id, batch) 
                     VALUES ($1, $2, $3, NULL, $4, $5) RETURNING *`;
        const params = [name, student_id, email, department_id, batch];

        console.log("DEBUG: Executing SQL:", sql, "with params:", params);

        const newUser = await pool.query(sql, params);

        const token = jwt.sign({ user_id: newUser.rows[0].user_id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: "Registration Successful!", token, user: newUser.rows[0] });

    } catch (err) {
        console.error("Google Registration Full Error:", err);
        res.status(500).json({ message: "Server Error during registration" });
    }
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found with this email." });
        }

        const user = userResult.rows[0];

        // Generate a 6-digit OTP/token
        const resetToken = crypto.randomInt(100000, 999999).toString();
        const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3',
            [resetToken, resetExpiry, user.user_id]
        );

        console.log(`____________________________________________________`);
        console.log(`🔑 PASSWORD RESET REQUEST`);
        console.log(`User: ${email}`);
        console.log(`Token: ${resetToken}`);
        console.log(`____________________________________________________`);

        res.json({ message: "Reset token sent to your email (simulated in console)." });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Server Error during forgot password flow" });
    }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()',
            [email, token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        // Validate new password
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ message: passwordErrors.join(' ') });
        }

        const user = userResult.rows[0];
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
            [hashedPass, user.user_id]
        );

        res.json({ message: "Password updated successfully!" });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Server Error during password reset" });
    }
};

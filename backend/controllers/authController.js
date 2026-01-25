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
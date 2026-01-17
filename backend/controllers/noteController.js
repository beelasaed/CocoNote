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

// --- 2. Upload Note ---
exports.uploadNote = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        const { title, description, batch, department_id, course_id, category_id } = req.body;
        const uploader_id = req.user.user_id; 
        const filePath = '/uploads/' + req.file.filename;

        const newNote = await pool.query(
            `INSERT INTO note 
            (title, description, batch, department_id, course_id, category_id, uploader_id, file_path) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [title, description, batch, department_id, course_id, category_id, uploader_id, filePath]
        );

        res.status(201).json({ 
            message: "Note uploaded successfully!", 
            note: newNote.rows[0] 
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Database Error: Could not save note." });
    }
};

// --- 3. Get All Notes for Feed ---
exports.getAllNotes = async (req, res) => {
    try {
        const query = `
            SELECT n.note_id, n.title, n.description, n.file_path, n.created_at, n.batch,
                   n.upvotes, n.downloads, 
                   u.name AS uploader, 
                   c.code AS course, 
                   d.name AS department, 
                   cat.name AS category
            FROM note n
            JOIN users u ON n.uploader_id = u.user_id
            JOIN course c ON n.course_id = c.course_id
            JOIN departments d ON n.department_id = d.department_id
            JOIN category cat ON n.category_id = cat.category_id
            ORDER BY n.created_at DESC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).json({ message: "Server Error fetching feed" });
    }
};
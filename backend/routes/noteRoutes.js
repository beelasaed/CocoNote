const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware'); 

// --- Multer Storage Config ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Points to CocoNote/backend/uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed!'), false);
    }
});

// --- Note Routes ---

// 1. Get options for the dropdowns
router.get('/options', protect, noteController.getUploadOptions);

// 2. Upload a new note
router.post('/upload', protect, upload.single('pdfFile'), noteController.uploadNote);

// 3. Get all notes for the Feed (NEW)
router.get('/feed', protect, noteController.getAllNotes);

module.exports = router;
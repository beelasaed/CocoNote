const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
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

router.get('/options', protect, noteController.getUploadOptions);
router.get('/feed', protect, noteController.getAllNotes);
router.get('/my-notes', protect, noteController.getUserNotes);
router.get('/user/:user_id', protect, noteController.getNotesByUser); // Added route
router.get('/saved', protect, noteController.getSavedNotes); // MUST be before /:note_id
router.post('/upload', protect, upload.single('pdfFile'), noteController.uploadNote);
router.post('/upvote', protect, noteController.toggleUpvote);
router.post('/download', protect, noteController.trackDownload);
router.post('/upvote/json', protect, noteController.toggleUpvoteAJAX);
router.post('/download/json', protect, noteController.trackDownloadAJAX);

// Routes with :note_id parameter (must come after specific routes)
router.get('/:note_id', protect, noteController.getNoteById);
router.get('/:note_id/upvoters', protect, noteController.getNoteUpvoters);
router.get('/:note_id/is-saved', protect, noteController.checkIfNoteSaved);
router.post('/:note_id/save', protect, noteController.saveNote);
router.delete('/:note_id/save', protect, noteController.unsaveNote);

module.exports = router;
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// All routes here require authentication
router.use(protect);

// --- Comment Routes ---
router.post('/notes/:note_id/comments', commentController.postComment);
router.get('/notes/:note_id/comments', commentController.getCommentsByNote);
router.put('/comments/:comment_id', commentController.editComment);
router.delete('/comments/:comment_id', commentController.deleteComment);

// --- Voting ---
router.post('/comments/:comment_id/vote', commentController.voteComment);

// --- Preferences ---
router.post('/notes/:note_id/notification-preference', commentController.toggleNotificationPreference);

module.exports = router;

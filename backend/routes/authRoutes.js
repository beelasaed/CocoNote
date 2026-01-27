const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Define the URLs
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/departments', authController.getDepartments);
router.get('/me', protect, authController.getCurrentUser);

// Notification routes
router.get('/notifications', protect, authController.getNotifications);
router.post('/notifications/read', protect, authController.markNotificationAsRead);
router.get('/notifications/unread-count', protect, authController.getUnreadCount);

// Public user profile (no auth required)
router.get('/profile/:user_id', authController.getPublicUserProfile);

// Leaderboard (no auth required)
router.get('/leaderboard', authController.getLeaderboard);

module.exports = router;
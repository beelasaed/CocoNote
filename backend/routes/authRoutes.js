const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Multer config for profile picture
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (JPEG/JPG/PNG) are allowed!'));
        }
    }
});


router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/departments', authController.getDepartments);
router.get('/me', protect, authController.getCurrentUser);

// Profile routes
router.put('/profile', protect, upload.single('profilePicture'), authController.updateProfile);
router.delete('/profile', protect, authController.deleteUser);

// Notification routes
router.get('/notifications', protect, authController.getNotifications);
router.post('/notifications/read', protect, authController.markNotificationAsRead);
router.post('/notifications/delete', protect, authController.deleteNotification);
router.post('/notifications/delete-all', protect, authController.deleteAllNotifications);
router.get('/notifications/unread-count', protect, authController.getUnreadCount);

// Public user profile (no auth required)
router.get('/profile/:user_id', authController.getPublicUserProfile);

// Leaderboard (no auth required)
router.get('/leaderboard', authController.getLeaderboard);

module.exports = router;
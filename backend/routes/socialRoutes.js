const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { protect } = require('../middleware/authMiddleware');

router.post('/toggle', protect, socialController.toggleStar);
router.get('/status', protect, socialController.getStarStatus);
router.get('/list', protect, socialController.getStarred);
router.get('/followers', protect, socialController.getFollowers);

module.exports = router;

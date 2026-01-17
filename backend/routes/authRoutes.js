const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the URLs
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/departments', authController.getDepartments);

module.exports = router;
const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public route
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/update-profile', authenticateToken, updateProfile);
router.post('/logout', authenticateToken, logout);

module.exports = router;

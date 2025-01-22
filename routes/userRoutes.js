const express = require('express');
const { logout } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Logout route
router.post('/logout', authenticateToken, logout);

module.exports = router;
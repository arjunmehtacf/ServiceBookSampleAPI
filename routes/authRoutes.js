const express = require('express');
const authenticateToken = require('../middlewares/authMiddleware');
const { signup, login, logout, updateUser, changePassword, payments } = require('../controllers/authController');

const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/updateUser', authenticateToken, updateUser);
router.post('/changePassword', authenticateToken, changePassword);
router.post('/payments', authenticateToken, payments);

module.exports = router;
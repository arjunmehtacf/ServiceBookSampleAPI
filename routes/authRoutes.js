const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { signup, login } = require('../controllers/authController');
const { logout } = require('../controllers/authController');
const {invalidateToken} = require('../controllers/authController');

const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
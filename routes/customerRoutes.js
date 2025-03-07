const express = require('express');
const { addCustomer } = require('../controllers/customerController');
const authenticateToken = require('../middlewares/authMiddleware');
const { getAllCustomers } = require('../controllers/customerController');
const { getCustomerById } = require('../controllers/customerController');
const { deleteCustomerById } = require('../controllers/customerController');
const { updateCustomer } = require('../controllers/customerController');
const { addProfilePicture } = require('../controllers/customerController');
const { subscriptionPlan } = require('../controllers/customerController');
const { route } = require('./authRoutes');

const router = express.Router();

// Protect the route with the JWT middleware
router.post('/add', authenticateToken, addCustomer);
router.get('/getAllCustomers', authenticateToken, getAllCustomers);
router.post('/getCustomerById', authenticateToken, getCustomerById);
router.post('/deleteCustomerById', authenticateToken, deleteCustomerById);
router.post('/updateCustomerById', authenticateToken, updateCustomer);
router.post('/updateProfilePicture', authenticateToken, addProfilePicture);
router.post('/subscriptionPlan', authenticateToken, subscriptionPlan);

module.exports = router;


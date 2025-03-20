const express = require('express');
const authenticateToken = require('../middlewares/authMiddleware');
const { dashboard, subscriptionPlan, addProfilePicture, updateCustomer, deleteCustomerById, getCustomerById, getAllCustomers, addCustomer } = require('../controllers/customerController');
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
router.post('/dashboard', authenticateToken, dashboard);

module.exports = router;


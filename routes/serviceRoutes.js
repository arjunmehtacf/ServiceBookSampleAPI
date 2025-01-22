const express = require('express');
const router = express.Router();
const { addService, getServicesByCustomerId, deleteServiceById, updateServiceById } = require('../controllers/serviceController');
const authenticateToken = require('../middlewares/authMiddleware'); // JWT middleware

// Route to add a service
router.post('/addService', authenticateToken, addService);
router.post('/getServicesById', authenticateToken, getServicesByCustomerId);
router.post('/deleteServiceById', authenticateToken, deleteServiceById);
router.post('/updateServiceById', authenticateToken, updateServiceById);

module.exports = router;


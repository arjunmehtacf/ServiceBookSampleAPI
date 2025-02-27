const express = require('express');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const bodyParser = require('body-parser');
const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const app = express();
app.use(cors());

// Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);

module.exports = app;
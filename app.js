const express = require('express');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const bodyParser = require('body-parser');
const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const path = require('path');

const app = express();
app.use(cors());

// Middleware - use only one version of each parser, with proper limits
app.use(express.json({ limit: '50mb' })); // only once, with sufficient limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Optional: if you're still using body-parser, it must match the same limits
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);

module.exports = app;
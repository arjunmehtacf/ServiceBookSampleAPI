const { validateCustomer, addService, getServicesByCustomerId, deleteServiceById, updateServiceById, getAllService, getServicesByUserId } = require('../model/serviceModel');

// Add Service
exports.addService = (req, res) => {
  const {
    customer_id,
    user_id,
    visit_date,
    visit_time,
    purpose,
    particulars,
    tech_sign,
    cust_sign,
  } = req.body;

  // Validate required fields
  if (!customer_id || !user_id) {
    return res.status(400).json({ message: 'customer_id and user_id are required' });
  }

  // Optional: Check if user_id matches the id from JWT
  if (user_id !== req.user.id) {
    return res.status(403).json({ message: 'User ID does not match the token' });
  }

  // Validate customer_id and user_id in the customers table
  validateCustomer(user_id, customer_id, (err, isValid) => {
    if (err) {
      return res.status(500).json({ message: 'Error validating customer', error: err.message });
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid user_id or customer_id' });
    }

    // If validation passes, proceed to add the service record
    const serviceData = {
      customer_id,
      user_id,
      visit_date,
      visit_time,
      purpose,
      particulars,
      tech_sign,
      cust_sign,
    };

    addService(serviceData, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to add service', error: err.message });
      }
      res.status(201).json({ message: 'Service added successfully', service_detail_id: result.insertId });
    });
  });
};



// Get all services for a specific customer and user
exports.getServicesByCustomerId = (req, res) => {
  const { customer_id, user_id } = req.body;

  // Validate required fields
  if (!customer_id || !user_id) {
    return res.status(400).json({ message: 'customer_id and user_id are required' });
  }

  // Optional: Check if user_id matches the id from JWT
  if (user_id !== req.user.id) {
    return res.status(403).json({ message: 'User ID does not match the token' });
  }

  getServicesByCustomerId(customer_id, user_id, (err, services) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching services', error: err.message });
    }

    if (services.length === 0) {
      return res.status(404).json({ message: 'No services found for the given customer and user', data: services });
    }

    res.status(200).json({ message: 'Services fetched successfully', data: services });
  });
};


// Get a list of services for the given user
exports.getAllService = (req, res) => {
  const { user_id } = req.body;

  // Validate required fields
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  // Optional: Check if user_id matches the id from JWT
  if (user_id !== req.user.id) {
    return res.status(403).json({ message: 'User ID does not match the token' });
  }

  getServicesByUserId(user_id, (err, services) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching services', error: err.message });
    }

    if (services.length === 0) {
      return res.status(404).json({ message: 'No services found for the given user', data: services });
    }

    res.status(200).json({ message: 'Services fetched successfully', data: services });
  });
};


// Delete a service by service_detail_id
exports.deleteServiceById = (req, res) => {
  const { service_detail_id, user_id } = req.body;

  // Validate required fields
  if (!service_detail_id || !user_id) {
    return res.status(400).json({ message: 'service_detail_id and user_id are required' });
  }

  // Optional: Check if user_id matches the id from JWT
  if (user_id !== req.user.id) {
    return res.status(403).json({ message: 'User ID does not match the token' });
  }

  deleteServiceById(service_detail_id, user_id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting service', error: err.message });
    }

    res.status(200).json({ message: 'Service deleted successfully' });
  });
};


// Update a service record by service_detail_id
exports.updateServiceById = (req, res) => {
  const { service_detail_id, user_id, visit_date, visit_time, purpose, particulars, tech_sign, cust_sign } = req.body;

  // Validate required fields
  if (!service_detail_id || !user_id) {
    return res.status(400).json({ message: 'service_detail_id and user_id are required' });
  }

  // Optional: Check if user_id matches the id from JWT
  if (user_id !== req.user.id) {
    return res.status(403).json({ message: 'User ID does not match the token' });
  }

  const updatedData = { visit_date, visit_time, purpose, particulars, tech_sign, cust_sign };

  updateServiceById(service_detail_id, user_id, updatedData, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error updating service', error: err.message });
    }

    res.status(200).json({ message: 'Service updated successfully' });
  });
};
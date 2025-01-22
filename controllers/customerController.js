const db = require('../config/db');
const {
  getAllCustomers,
  getCustomerById,
  deleteCustomerById,
  addCustomer,
  updateCustomerById
} = require('../model/customerModel');


// Add Customer
exports.addCustomer = (req, res) => {
  const {
    user_id,
    name,
    address,
    mobile_number,
    res_mobile_number,
    c_mobile_number,
    unit_no,
    fitting_date,
    contract_date,
    con_payment,
    cash_cheque,
    payment_date,
    model,
    water_time,
    morning,
    noon,
    evening,
    instruction,
  } = req.body;

  // Validate required fields
  if (!user_id || !name) {
    return res.status(400).json({ message: 'user_id and name are required' });
  }

  // Optional: Check if user_id matches the id from JWT
  if (user_id !== req.user.id) {
    return res.status(403).json({ message: 'User ID does not match the token' });
  }

  const customerData = {
    user_id,
    name,
    address,
    mobile_number,
    res_mobile_number,
    c_mobile_number,
    unit_no,
    fitting_date,
    contract_date,
    con_payment,
    cash_cheque,
    payment_date,
    model,
    water_time,
    morning,
    noon,
    evening,
    instruction,
  };

  addCustomer(customerData, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to add customer', error: err.message });
    }
    res.status(201).json({ message: 'Customer added successfully', customer_id: result.insertId });
  });
};

// Get All Customer

exports.getAllCustomers = (req, res) => {
  getAllCustomers((err, customers) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching customer data', error: err });
    }
    res.status(200).json({ message: 'Customer data fetched successfully', data: customers });
  });
};

// Get Customer by userID

exports.getCustomerById = (req, res) => {
  const { user_id } = req.body; // Extract user_id from the POST request body

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  getCustomerById(user_id, (err, customer) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching customer data', error: err.message });
    }
    res.status(200).json({ message: 'Customer data fetched successfully', data: customer });
  });
};


// Controller function to handle the request and response for deleting customer data by customer_id
exports.deleteCustomerById = (req, res) => {
  const { customer_id, user_id } = req.body; // Extract customer_id from the POST request body

  if (!customer_id) {
    return res.status(400).json({ message: 'customer_id is required' });
  }

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  deleteCustomerById(customer_id, user_id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting customer data', error: err.message });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  });
};


// Update the customer by customer_id
exports.updateCustomer = (req, res) => {
  const customerData = req.body;

  if (!customerData.customer_id || !customerData.user_id) {
    return res.status(400).json({ message: 'Customer ID and User ID are required' });
  }

  updateCustomerById(customerData, (err, results) => {
    if (err) {
      console.error('Error updating customer:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer updated successfully' });
  });
};
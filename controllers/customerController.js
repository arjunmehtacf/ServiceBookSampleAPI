const db = require('../config/db');
const {
  getAllCustomers,
  getCustomerById,
  deleteCustomerById,
  addCustomer,
  updateCustomerById,
  updateProfilePicture,
  getAllSubscriptionPlans
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
  const { user_id, page = 1, limit = 10, search } = req.body; // Added 'search' param

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  // Convert page and limit to integers
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum; // Calculate offset

  getCustomerById(user_id, limitNum, offset, search, (err, results, totalCount) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Error fetching customer data', error: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No customers found, please add new customers.' });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      message: 'Customer data fetched successfully',
      data: results,
      pagination: {
        totalRecords: totalCount,
        totalPages: totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
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


// Update customer profile picture
exports.addProfilePicture = async (req, res) => {
  try {
    const { user_id, profile_picture } = req.body;

    if (!user_id || !profile_picture) {
      return res.status(400).json({ message: "User ID and Profile Picture are required" });
    }

    // Update user profile picture
    const result = await updateProfilePicture(user_id, profile_picture);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile picture updated successfully", profile_picture: profile_picture });

  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Subscription Plan
exports.subscriptionPlan = (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  getAllSubscriptionPlans(user_id, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching subscription plans', error: err });
    }

    res.status(200).json({
      message: 'Subscription plans fetched successfully',
      data: results,
    });
  });
};


// Dashboard API

exports.dashboard = (req, res) => {
  const { user_id } = req.body;

  console.log("userId:", user_id);

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Fetch recent service details with customer info
  const serviceQuery = `
    SELECT 
      sd.service_detail_id, 
      sd.visit_date, 
      sd.visit_time, 
      sd.purpose,
      sd.tech_sign,
      sd.cust_sign, 
      sd.particulars,
      c.name AS customer_name,
      c.address AS customer_address,
      c.mobile_number AS customer_mobile_number,
      c.customer_id,
      sd.user_id,
      c.model AS customer_model
    FROM service_detail sd
    JOIN customers c ON sd.customer_id = c.customer_id
    WHERE sd.user_id = ?
    ORDER BY sd.visit_date DESC, sd.visit_time DESC
    LIMIT 2;
  `;

  // Fetch subscription details and calculate remaining days
  const subscriptionQuery = `
    SELECT subscription_end_date
    FROM subscription_detail
    WHERE user_id = ?
    ORDER BY subscription_start_date DESC
    LIMIT 1;
  `;

  db.query(serviceQuery, [user_id], (serviceErr, serviceResults) => {
    if (serviceErr) {
      console.error('Error fetching service details:', serviceErr);
      return res.status(500).json({ error: 'Failed to fetch service details' });
    }

    db.query(subscriptionQuery, [user_id], (subscriptionErr, subscriptionResults) => {
      if (subscriptionErr) {
        console.error('Error fetching subscription details:', subscriptionErr);
        return res.status(500).json({ error: 'Failed to fetch subscription details' });
      }

      let remainingDays = null;
      if (subscriptionResults.length > 0 && subscriptionResults[0].subscription_end_date) {
        const endDate = new Date(subscriptionResults[0].subscription_end_date);
        const currentDate = new Date();
        const timeDiff = endDate.getTime() - currentDate.getTime();
        remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (remainingDays < 0) {
          remainingDays = 0;
        }
      }

      res.json({
        recentServices: serviceResults,
        subscriptionRemainingDays: remainingDays,
      });
    });
  });
};
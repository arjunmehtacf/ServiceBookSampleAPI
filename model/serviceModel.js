const db = require('../config/db');

// Function to validate user_id and customer_id in customers table
const validateCustomer = (user_id, customer_id, callback) => {
  const query = `
    SELECT * FROM customers 
    WHERE user_id = ? AND customer_id = ?
  `;

  db.query(query, [user_id, customer_id], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results.length > 0); // Return true if match is found
  });
};

// Function to add a service record
const addService = (serviceData, callback) => {
  const query = `
    INSERT INTO service_detail 
    (customer_id, user_id, visit_date, visit_time, purpose, particulars, tech_sign, cust_sign) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const {
    customer_id,
    user_id,
    visit_date,
    visit_time,
    purpose,
    particulars,
    tech_sign,
    cust_sign,
  } = serviceData;

  db.query(
    query,
    [customer_id, user_id, visit_date, visit_time, purpose, particulars, tech_sign, cust_sign],
    (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    }
  );
};


// Function to fetch all services for a specific customer_id and user_id
const getServicesByCustomerId = (customer_id, user_id, callback) => {
  const query = `
      SELECT service_detail_id, customer_id, user_id, visit_date, visit_time, purpose, particulars, tech_sign, cust_sign 
      FROM service_detail 
      WHERE customer_id = ? AND user_id = ?
    `;

  db.query(query, [customer_id, user_id], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};


// Function to fetch all services for a specific user_id
const getServicesByUserId = (user_id, callback) => {
  const query = `
      SELECT service_detail_id, customer_id, user_id, visit_date, visit_time, purpose, particulars, tech_sign, cust_sign 
      FROM service_detail 
      WHERE user_id = ?
    `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Function to delete a service based on service_detail_id and user_id
const deleteServiceById = (service_detail_id, user_id, callback) => {
  const query = `
    DELETE FROM service_detail 
    WHERE service_detail_id = ? AND user_id = ?
  `;

  db.query(query, [service_detail_id, user_id], (err, results) => {
    if (err) {
      return callback(err, null);
    }

    // If no rows affected, the service wasn't found
    if (results.affectedRows === 0) {
      return callback(new Error('Service not found or unauthorized access'), null);
    }

    callback(null, results);
  });
};


// Function to update a service record by service_detail_id and user_id
const updateServiceById = (service_detail_id, user_id, updatedData, callback) => {
  const query = `
    UPDATE service_detail
    SET visit_date = ?, visit_time = ?, purpose = ?, particulars = ?, tech_sign = ?, cust_sign = ?
    WHERE service_detail_id = ? AND user_id = ?
  `;

  const {
    visit_date,
    visit_time,
    purpose,
    particulars,
    tech_sign,
    cust_sign,
  } = updatedData;

  db.query(
    query,
    [visit_date, visit_time, purpose, particulars, tech_sign, cust_sign, service_detail_id, user_id],
    (err, results) => {
      if (err) {
        return callback(err, null);
      }

      // If no rows affected, the service wasn't found or unauthorized access
      if (results.affectedRows === 0) {
        return callback(new Error('Service not found or unauthorized access'), null);
      }

      callback(null, results);
    }
  );
};

module.exports = { validateCustomer, addService, getServicesByCustomerId, deleteServiceById, updateServiceById, getServicesByUserId };

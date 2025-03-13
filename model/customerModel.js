const db = require('../config/db'); // Adjust the db import if needed

// Function to fetch all customer data from the database
const getAllCustomers = (callback) => {
    const query = 'SELECT user_id, name, address, mobile_number, res_mobile_number, c_mobile_number, unit_no, fitting_date, contract_date, con_payment, cash_cheque, payment_date, model, water_time, morning, noon, evening, instruction FROM customers';

    db.query(query, (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Function to get all customers of specific user.
const getCustomerById = (user_id, limit, offset, search, callback) => {
    let query = `
      SELECT SQL_CALC_FOUND_ROWS user_id, customer_id, name, address, mobile_number, 
             res_mobile_number, c_mobile_number, unit_no, fitting_date, contract_date, 
             con_payment, cash_cheque, payment_date, model, water_time, morning, 
             noon, evening, instruction 
      FROM customers 
      WHERE user_id = ?`;
  
    // Add the search condition if the search term is provided
    const queryParams = [user_id];
    
    if (search) {
      query += ` AND (name LIKE ? OR address LIKE ? OR mobile_number LIKE ?)`;
      const searchTerm = `%${search}%`;  // Adding '%' for partial matching
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
  
    query += ` LIMIT ? OFFSET ?`;
  
    queryParams.push(limit, offset);
  
    db.query(query, queryParams, (err, results) => {
      if (err) {
        return callback(err, null, 0);
      }
  
      // Get total count of records
      db.query("SELECT FOUND_ROWS() AS totalCount", (err, countResults) => {
        if (err) {
          return callback(err, null, 0);
        }
  
        const totalCount = countResults[0].totalCount;
        callback(null, results, totalCount);
      });
    });
  };


//Function to delete a customer using their customer id
const deleteCustomerById = (customer_id, user_id, callback) => {
    const query = 'DELETE FROM customers WHERE customer_id = ? AND user_id = ?';

    db.query(query, [customer_id, user_id], (err, results) => {
        if (err) {
            return callback(err, null);
        }

        // If no rows affected, the customer wasn't found
        if (results.affectedRows === 0) {
            return callback(new Error('Customer not found'), null);
        }

        callback(null, results);
    });
};


// Function to add a customer to the database
const addCustomer = (customerData, callback) => {
    const query = `
      INSERT INTO customers 
      (user_id, name, address, mobile_number, res_mobile_number, c_mobile_number, unit_no, 
       fitting_date, contract_date, con_payment, cash_cheque, payment_date, model, 
       water_time, morning, noon, evening, instruction) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

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
    } = customerData;

    db.query(
        query,
        [
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
        ],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        }
    );
};


//update customer information API model
const updateCustomerById = (customerData, callback) => {
    const updateQuery = `
      UPDATE customers 
      SET 
        user_id = ?, 
        name = ?, 
        address = ?, 
        mobile_number = ?, 
        res_mobile_number = ?, 
        c_mobile_number = ?, 
        unit_no = ?, 
        fitting_date = ?, 
        contract_date = ?, 
        con_payment = ?, 
        cash_cheque = ?, 
        payment_date = ?, 
        model = ?, 
        water_time = ?, 
        morning = ?, 
        noon = ?, 
        evening = ?, 
        instruction = ? 
      WHERE 
        customer_id = ?
    `;
  
    const values = [
      customerData.user_id,
      customerData.name,
      customerData.address,
      customerData.mobile_number,
      customerData.res_mobile_number,
      customerData.c_mobile_number,
      customerData.unit_no,
      customerData.fitting_date,
      customerData.contract_date,
      customerData.con_payment,
      customerData.cash_cheque,
      customerData.payment_date,
      customerData.model,
      customerData.water_time,
      customerData.morning,
      customerData.noon,
      customerData.evening,
      customerData.instruction,
      customerData.customer_id, // Get `customer_id` from the body
    ];
  
    db.query(updateQuery, values, callback);
  };
  

  // function to update customer profile picture

  const updateProfilePicture = (user_id, profile_picture) => {
        return new Promise((resolve, reject) => {
            const query = "UPDATE users SET profile_picture = ? WHERE id = ?";
            db.query(query, [profile_picture, user_id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    
};


// get all susbcription plan

const getAllSubscriptionPlans = (user_id, callback) => {
  const query = 'SELECT plan_id, title, price, description, duration, amount, button_text FROM subscription_plan';

  db.query(query, (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      // Fetch subscription status for each plan and check end date
      const subscriptionStatusPromises = results.map(plan => {
        return new Promise((resolve, reject) => {
          const subscriptionQuery = `
            SELECT subscription_status, subscription_end_date AS end_date
            FROM subscription_detail 
            WHERE user_id = ? AND plan_id = ?
          `;
          db.query(subscriptionQuery, [user_id, plan.plan_id], (subscriptionErr, subscriptionResults) => {
            if (subscriptionErr) {
              reject(subscriptionErr);
            } else {
              let isSubscribed = false;
              let isSubscribedOnce = false; // Initialize isSubscribedOnce

              if (subscriptionResults.length > 0) {
                // If there are any subscription records, the plan was subscribed at some point
                isSubscribedOnce = true;

                if (subscriptionResults[0].subscription_status === 1) {
                  const endDate = subscriptionResults[0].end_date;
                  if (endDate) {
                    const currentDate = new Date();
                    isSubscribed = new Date(endDate) >= currentDate;
                  } else {
                    // If end_date is null, assume subscription is active
                    isSubscribed = true;
                  }
                }
              }

              resolve({ ...plan, isSubscribed, isSubscribedOnce }); // Include isSubscribedOnce in the resolved object
            }
          });
        });
      });

      // Resolve all subscription status promises
      Promise.all(subscriptionStatusPromises)
        .then(updatedResults => {
          callback(null, updatedResults); // Pass only updatedResults to callback
        })
        .catch(err => {
          callback(err, null); // Pass only err to callback
        });
    }
  });
};


module.exports = { getAllCustomers, getCustomerById, deleteCustomerById, addCustomer, updateCustomerById, updateProfilePicture, getAllSubscriptionPlans };
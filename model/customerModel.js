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
const getCustomerById = (user_id, callback) => {
    const query = `
        SELECT user_id, customer_id, name, address, mobile_number, res_mobile_number, c_mobile_number, 
               unit_no, fitting_date, contract_date, con_payment, cash_cheque, payment_date, 
               model, water_time, morning, noon, evening, instruction 
        FROM customers 
        WHERE user_id = ?`;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            // Return actual database errors
            return callback(err, null);
        }
        // Return `null` if no customer is found
        if (results.length === 0) {
            return callback(null, null); // No error, but no data either
        }
        // Return the results
        callback(null, results);
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
  


module.exports = { getAllCustomers, getCustomerById, deleteCustomerById, addCustomer, updateCustomerById };
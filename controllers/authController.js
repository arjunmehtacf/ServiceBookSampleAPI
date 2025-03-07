const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { invalidateToken } = require('../model/authModel');

const JWT_SECRET = '2cf8abb9231cd14fe3bd9cd3fd304c715c334a51aa682a1b720d395cd0634e74';

// Signup handler
exports.signup = async (req, res) => {
  const { username, email, password, role, birthdate, profile_picture, first_name, last_name, mobile_number } = req.body;

  // Check if all required fields are provided
  if ( !mobile_number || !email || !password || !role || !birthdate || !first_name || !last_name) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    // Check if the user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const insertUserQuery = `
        INSERT INTO users (username, email, password, role, birthdate, profile_picture, first_name, last_name, mobile_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertUserQuery,
        [
          username || '',
          email,
          hashedPassword,
          role,
          birthdate,
          profile_picture || '', // Handle optional profile_picture
          first_name,
          last_name,
          mobile_number
        ],
        (err) => {
          if (err) throw err;
          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Login handler
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const access_token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '5h' });
      res.status(200).json({ message: 'Login Successful', access_token, user_id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, mobile_number: user.mobile_number, birthdate: user.birthdate, profile_picture: user.profile_picture});
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

//logout handler
// Logout function
exports.logout = (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from the authorization header

  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  // Invalidate the token (add to blacklist)
  invalidateToken(token);

  // Respond with a success message
  res.status(200).json({ message: 'Logout successful, token invalidated' });
};

// Update user details

exports.updateUser = (req, res) => {
  const { user_id, first_name, last_name, email, mobile_number, birthdate } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const updateUserQuery = `
    UPDATE users 
    SET 
      first_name = ?, 
      last_name = ?, 
      email = ?, 
      mobile_number = ?, 
      birthdate = ?
    WHERE 
      id = ?
  `;

  db.query(
    updateUserQuery,
    [first_name, last_name, email, mobile_number, birthdate, user_id],
    (err, results) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Profile updated successfully' });
    }
  );
}

// Change password
exports.changePassword = async (req, res) => {
  const { user_id, old_password, new_password } = req.body;

  if (!user_id || !old_password || !new_password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const checkUserQuery = 'SELECT * FROM users WHERE id = ?';
    db.query(checkUserQuery, [user_id], async (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(old_password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid password' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
      db.query(updatePasswordQuery, [hashedPassword, user_id], (err) => {
        if (err) throw err;
        res.status(200).json({ message: 'Password updated successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Payments handler
exports.payments = (req, res) => {
  const { user_id, amount, payment_id, order_id, currency} = req.body;

  if (!user_id || !amount || !payment_id || !currency) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const addPaymentQuery = `
    INSERT INTO payments (user_id, payment_id, order_id, amount, currency, payment_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    addPaymentQuery,
    [user_id, payment_id, order_id, amount, currency, 'success'],
    (err) => {
      if (err) {
        console.error('Error adding payment:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.status(201).json({ message: 'Payment added successfully' });
    }
  );
};
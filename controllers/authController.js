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
      res.status(200).json({ message: 'Login Successful', access_token, user_id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, profile_picture: user.profile_picture});
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
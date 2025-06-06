const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { invalidateToken } = require('../model/authModel');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv').config();
const os = require('os');


let refreshTokensDB = {}; // In-memory store for refresh tokens

// Signup handler
exports.signup = async (req, res) => {
  const { username, email, password, role, birthdate, profile_picture, first_name, last_name, mobile_number } = req.body;

  // Check if all required fields are provided
  if (!mobile_number || !email || !password || !role || !birthdate || !first_name || !last_name) {
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

      const access_token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '5h' });

      // Fetch the latest subscription
      const subscriptionQuery = `
        SELECT subscription_end_date 
        FROM subscription_detail 
        WHERE user_id = ? 
        ORDER BY subscription_start_date DESC 
        LIMIT 1
      `;

      db.query(subscriptionQuery, [user.id], (subscriptionErr, subscriptionResults) => {
        if (subscriptionErr) {
          console.error("Error fetching subscription details:", subscriptionErr);
        }

        const currentDate = new Date();
        let subscriptionStatus = false;

        if (
          subscriptionResults &&
          subscriptionResults.length > 0 &&
          new Date(subscriptionResults[0].subscription_end_date).getTime() > currentDate.getTime()
        ) {
          subscriptionStatus = true;
        }

        res.status(200).json({
          message: 'Login Successful',
          access_token,
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          mobile_number: user.mobile_number,
          birthdate: user.birthdate,
          subscription_status: subscriptionStatus,
          profile_picture: user.profile_picture
        });
      });
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
  const { user_id, amount, payment_id, order_id, currency, subscription_plan_id } = req.body;

  if (!user_id || !amount || !payment_id || !currency || !subscription_plan_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const addPaymentQuery = `
    INSERT INTO payments (user_id, payment_id, order_id, amount, currency, payment_status, subscription_plan_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    addPaymentQuery,
    [user_id, payment_id, order_id, amount, currency, 'success', subscription_plan_id],
    (err) => {
      if (err) {
        console.error('Error adding payment:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Fetch subscription plan duration to calculate end date
      const getPlanDurationQuery = 'SELECT duration FROM subscription_plan WHERE plan_id = ?';
      db.query(getPlanDurationQuery, [subscription_plan_id], (planErr, planResults) => {
        if (planErr) {
          console.error('Error fetching plan duration:', planErr);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (planResults.length === 0) {
          return res.status(400).json({ message: 'Subscription plan not found' });
        }

        const duration = planResults[0].duration;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration);

        // Add record to subscription_detail table
        const addSubscriptionDetailQuery = `
          INSERT INTO subscription_detail (user_id, plan_id, subscription_start_date, subscription_end_date, subscription_status)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          addSubscriptionDetailQuery,
          [user_id, subscription_plan_id, startDate, endDate, 1], // Assuming 1 for active subscription
          (subErr) => {
            if (subErr) {
              console.error('Error adding subscription detail:', subErr);
              return res.status(500).json({ message: 'Internal server error' });
            }

            res.status(201).json({ message: 'Your subscription has been successfully activated. Enjoy!' });
          }
        );
      });
    }
  );
};

// Get local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (let iface in interfaces) {
    for (let alias of interfaces[iface]) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost'; // fallback
}

const PORT = process.env.PORT || 3000;
const HOST = getLocalIp();

// Helper function to send email
const sendEmail = (email, resetToken) => {
  const resetLink = `http://${HOST}:${PORT}/reset-password.html?token=${resetToken}`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
      user: 'nitsjhonson@gmail.com',
      pass: 'uftj uexl qthz cbuw',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Password Reset Request',
    text: `Click the link below to reset your password:\n${resetLink}`,
  };

  return transporter.sendMail(mailOptions);
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  // Step 1: Verify email exists in the database
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'No account found with that email' });
    }

    const user = results[0];

    // Step 2: Generate a reset token (random string)
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour expiration

    // Step 3: Save the reset token and expiration in the database
    db.query('UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?',
      [resetToken, resetTokenExpiration, email], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update user with reset token' });
        }

        // Step 4: Send the reset email
        sendEmail(email, resetToken)
          .then(() => {
            res.status(200).json({ message: `Password reset link sent to ${email}. Please check your inbox and click the given reset link to reset your password.` });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).json({ error: 'Failed to send email' });
          });
      });
  });
};

// Reset Password Endpoint
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Check if the token is valid
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from the database using the decoded email
    db.query('SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiration > NOW()', [decoded.email, token], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database query error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const user = results[0];

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password and clear the reset token
      db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE email = ?', [hashedPassword, decoded.email], (updateErr, updateResults) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update password' });
        }

        res.status(200).json({ message: 'Password reset successfully' });
      });
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// Generate a new access token
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// Generate a new refresh token
function generateRefreshToken(userId) {
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  // Store the refresh token (in-memory store or database in production)
  refreshTokensDB[userId] = refreshToken;
  return refreshToken;
}

// Refresh token endpoint
exports.refreshToken = (req, res) => {
  const { userId, oldRefreshToken } = req.body;

  if (!userId || !oldRefreshToken) {
    return res.status(400).json({ message: 'User ID and Refresh Token are required.' });
  }

  // Check if the old refresh token exists in the database
  if (refreshTokensDB[userId] !== oldRefreshToken) {
    return res.status(403).json({ message: 'Invalid or expired refresh token.' });
  }

  // Verify the old refresh token
  jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }

    // Generate a new access token and refresh token
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
};

// App version endpoint
exports.appVersion = (req, res) => {
  const { version } = req.body;

  if (!version) {
    return res.status(400).json({ message: 'Version is required' });
  }

  try {
    db.query('SELECT version_name FROM app_version WHERE version_name = ?', [version], (err, results) => {
      if (err) {
        console.error('Error fetching app version:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (results.length === 0) {
        return res.status(200).json({ message: 'Your application is out dated, please update the app from playstore by clicking below update app button.', result: false });
      } else {
        return res.status(200).json({
          message: 'You are up to date',
          result: true
        });
      }

    });
  } catch (error) {
    console.error('Error checking app version:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
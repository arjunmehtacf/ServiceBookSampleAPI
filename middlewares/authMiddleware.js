const jwt = require('jsonwebtoken');
// Replace with your actual secret key
const JWT_SECRET = '2cf8abb9231cd14fe3bd9cd3fd304c715c334a51aa682a1b720d395cd0634e74'; 
const { tokenBlacklist } = require('../model/authModel'); 

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check if the Authorization header exists
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  // Check if the token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(403).json({ message: 'Token has been invalidated' });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Attach the user to the request object
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
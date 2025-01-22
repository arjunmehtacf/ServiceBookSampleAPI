const { addToBlacklist } = require('../utils/tokenBlacklist');

exports.logout = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.split(' ')[1];

  // Add token to blacklist
  addToBlacklist(token);

  res.status(200).json({ message: 'Logged out successfully' });
};
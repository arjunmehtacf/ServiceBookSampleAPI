// In-memory token blacklist (in production, you could use Redis or a database)
const tokenBlacklist = new Set();

// Function to invalidate the token by adding it to the blacklist
const invalidateToken = (token) => {
  tokenBlacklist.add(token);
};

// Export the invalidateToken function
module.exports = { tokenBlacklist,invalidateToken };

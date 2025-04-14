const app = require('./app');

// const PORT = 15303;
// const PORT = 3000;
const PORT = 3306;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const mysql = require('mysql');

// Database connection
const db = mysql.createConnection({
  host: 'servicbook-database.cbk4ossa6bpb.us-east-1.rds.amazonaws.com',
  user: 'root',
  password: 'Dhruv$100690',
  database: 'compose'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

module.exports = db;
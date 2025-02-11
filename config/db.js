const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  // host: 'servicbook-database.cbk4ossa6bpb.us-east-1.rds.amazonaws.com',
  host: 'localhost',
  //mysql://root:kfhuOThTptyOluLGLqlMFXrHaFGavoBe@roundhouse.proxy.rlwy.net:15303/railway
  // host:'roundhouse.proxy.rlwy.net',
  user: 'root',
  // password: 'kfhuOThTptyOluLGLqlMFXrHaFGavoBe',
  password:'root123',
  // password: 'Dhruv$100690',
  database: 'compose',
  // database: 'railway',
  // port: 15303, // Use the Railway port from your credentials
  connectTimeout: 10000,
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

module.exports = db;
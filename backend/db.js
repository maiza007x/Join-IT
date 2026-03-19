const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',   // XAMPP ปกติไม่มีรหัส
  database: 'join_it'
});

module.exports = db;
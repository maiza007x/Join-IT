require("dotenv").config();
const mysql = require("mysql2/promise");

// ค่า Configuration ส่วนกลาง
const commonConfig = {
  host: process.env.CONNECTSQL,
  user: process.env.USERSQL,
  password: "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
  dateStrings: true,
  decimalNumbers: true,
  enableKeepAlive: true,
};

// สร้าง Pool สำหรับ Join-IT
const joinPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DBSQL,
});

// สร้าง Pool สำหรับ Order-IT
const orderPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DBSQL_ORDER,
});

// ดักจับ Error แยกกัน
joinPool.on("error", (err) => console.error("Join-IT Pool Error:", err));
orderPool.on("error", (err) => console.error("Order-IT Pool Error:", err));

module.exports = { joinPool, orderPool };
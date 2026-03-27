require("dotenv").config();
const mysql = require("mysql2/promise");

// ตรวจสอบก่อนว่าตัวแปรหลักมาครบไหม (เอาไว้ Debug)
if (!process.env.CONNECTSQL || !process.env.USERSQL) {
  console.error("❌ [Config]: Missing critical Env variables in .env file!");
}

const commonConfig = {
  host: process.env.CONNECTSQL,
  user: process.env.USERSQL,
  password: process.env.PASSWORDSQL || "", // ใช้จาก .env ถ้าไม่มีค่อยเป็นค่าว่าง
  port: Number(process.env.PORTSQL) || 3306, // เผื่อกรณีใช้ Port อื่น
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
  dateStrings: true,
  decimalNumbers: true,
  enableKeepAlive: true,
};

// สร้าง Pool แบบดัก Error ตั้งแต่ตอนสร้าง
let joinPool;
let orderPool;

try {
  joinPool = mysql.createPool({
    ...commonConfig,
    database: process.env.DBSQL,
  });

  orderPool = mysql.createPool({
    ...commonConfig,
    database: process.env.DBSQL_ORDER,
  });
} catch (setupError) {
  console.error("❌ [MySQL Setup Error]:", setupError.message);
}

// ดักจับ Error ระหว่างใช้งาน
joinPool.on("error", (err) => console.error("🔴 Join-IT Pool Runtime Error:", err));
orderPool.on("error", (err) => console.error("🔴 Order-IT Pool Runtime Error:", err));

module.exports = { joinPool, orderPool };
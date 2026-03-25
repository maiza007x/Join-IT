require("dotenv").config();
const { createServer } = require("node:http");
const pool = require("./mysql");
const app = require("./app");

async function startServer() {
  try {
    // ✅ 1. ตรวจสอบการเชื่อมต่อฐานข้อมูล
    const connection = await pool.getConnection();
    console.log("🟢 [Database]: MySQL connected successfully.");
    connection.release();

    // ✅ 2. สร้าง Server จาก App (Express)
    const server = createServer(app);

    const PORT = process.env.PORT || 5000;
    const HOST = "0.0.0.0"; // เพื่อให้เข้าถึงได้จาก IP อื่นในวงแลนเดียวกัน

    server.listen(PORT, HOST, () => {
      console.log(`-------------------------------------------`);
      console.log(`🚀  Server is flying at http://localhost:${PORT}`);
      console.log(`📁  Static assets: http://localhost:${PORT}/uploads`);
      console.log(`-------------------------------------------`);
    });

  } catch (err) {
    console.error("🔴 [Error]: Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
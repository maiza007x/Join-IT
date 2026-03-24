// // backend/server.js
// const express = require("express");
// const app = express();

// app.use(express.json());

// app.post("/auth/login", (req, res) => {
//   const { username } = req.body;
//   res.json({ token: "123456" });
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });
require("dotenv").config();
const { createServer } = require("node:http");
const pool = require("./mysql");
const app = require("./app");
const userRoutes = require('./api_routes/user'); // นำเข้าไฟล์ route ที่เราเพิ่งสร้าง
async function startServer() {
  
  try {
    // ✅ test mysql connection ก่อน
    const connection = await pool.getConnection();
    console.log("✅ MySQL connected");
    connection.release();

    const server = createServer(app);

    const HOST = "0.0.0.0";

    server.listen(process.env.PORT, HOST, () => {
      console.log(`🚀 Server running at http://${HOST}:${process.env.PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
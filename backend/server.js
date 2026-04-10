require("dotenv").config();
const { createServer } = require("node:http");
const { joinPool, orderPool } = require("./mysql");
const app = require("./app");

async function startServer() {
  try {
// ตรวจสอบ Join-IT
    const conn1 = await joinPool.getConnection();
    console.log("🟢 [Database]: Join-IT connected.");
    conn1.release();

    // ตรวจสอบ Order-IT
    const conn2 = await orderPool.getConnection();
    console.log("🟢 [Database]: Order-IT connected.");
    conn2.release();

    // ✅ 2. สร้าง Server จาก App (Express)
    const server = createServer(app);

    // ✅ 3. ตั้งค่า Socket.io
    const { Server } = require("socket.io");
    const io = new Server(server, {
      cors: {
        origin: "*", // ใน Production ควรระบุ Domain ของ Frontend
        methods: ["GET", "POST"]
      }
    });

    // แนบ io ไปกับ app เพื่อให้เรียกใช้ได้จาก Routes อื่นๆ
    app.set("io", io);

    // เริ่มระบบ Monitor งานใหม่
    const { startMonitoring } = require("./helper/socketMonitor");
    startMonitoring(io);

    io.on("connection", (socket) => {
      console.log(`🔌 [Socket]: Client connected (${socket.id})`);
      socket.on("disconnect", () => {
        console.log(`🔌 [Socket]: Client disconnected`);
      });
    });

    const PORT = process.env.PORT || 5000;
    const HOST = "0.0.0.0"; // เพื่อให้เข้าถึงได้จาก IP อื่นในวงแลนเดียวกัน

    server.listen(PORT, HOST, () => {
      console.log(`-------------------------------------------`);
      console.log(`🚀  Server is flying at http://localhost:${PORT}`);
      console.log(`📁  Static assets: http://localhost:${PORT}/uploads`);
      console.log(`🛰️  Real-time: Socket.io is active`);
      console.log(`-------------------------------------------`);
    });

 } catch (err) {
    console.error("🔴 [Error]: Failed to start server:");
    console.error(err); // <--- แก้ตรงนี้: เอา .message ออก เพื่อให้เห็น Error ทั้งก้อน (Stack Trace)
    process.exit(1);
  }
}

startServer();
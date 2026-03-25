const express = require("express");
const path = require("path"); // ✅ เพิ่ม path
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// Routes
const indexRoutes = require("./api_routes/auth");
const linenRoutes = require("./api_routes/tasks");
const userRoutes = require("./api_routes/user");

const app = express();
const handleLogout = () => {
    localStorage.clear(); // ล้างทิ้งให้หมด ไม่ใช่แค่ token
    sessionStorage.clear(); // ล้าง session เผื่อมีค้าง
    navigate("/login", { replace: true }); // replace: true จะทำให้ย้อนกลับมาหน้า task ไม่ได้
};
// ✅ 1. แก้ไข Helmet: ปิด Resource Policy บางตัวที่ขัดขวางการแสดงรูปภาพ
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // อนุญาตให้ดึงรูปข้าม origin
    crossOriginEmbedderPolicy: false, // ปิดตัวที่ทำให้เกิด NotSameOrigin error
  })
);

// ✅ 2. CORS: แนะนำให้ระบุ Origin เฉพาะเจาะจงแทน "*" เพื่อความปลอดภัยและความเสถียร
app.use(cors({ 
  origin: true, // หรือใส่ "http://localhost:5173"
  credentials: true 
}));

app.use(express.json());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(cookieParser());

// ✅ 3. Static Files: เพิ่ม Header ย้ำอีกครั้งเพื่อความชัวร์ในการดึงรูป
app.use('/uploads', (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes Setup
app.use("/api/auth", indexRoutes);
app.use("/api", linenRoutes);
app.use('/api/users', userRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error("🔴 Server Error:", err.stack);
  res.status(500).json({ 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

module.exports = app;
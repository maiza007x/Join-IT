const express = require("express");
const path = require("path"); 
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// Routes
const authRoutes = require("./api_routes/auth");
const userRoutes = require("./api_routes/user");
const taskRoutes = require("./api_routes/tasks"); // รวมงานทั้งหมดไว้ที่นี่
const settingRoutes = require("./api_routes/settings");
const webhooksRoutes = require("./api_routes/webhooks");

const app = express();

// ✅ 1. Middleware Setup
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({ 
  origin: true, 
  credentials: true 
}));

app.use(express.json());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(cookieParser());

// ✅ 2. Static Files (รูปภาพ)
app.use('/uploads', (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.join(__dirname, 'uploads')));

// ✅ 3. Routes Setup (จัดลำดับใหม่ให้ไม่งง)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes); 
app.use("/api/settings", settingRoutes);
app.use("/api/webhooks", webhooksRoutes);

// ✅ 4. Error Handler
app.use((err, req, res, next) => {
  console.error("🔴 Server Error:", err.stack);
  res.status(500).json({ 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

module.exports = app;
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const indexRoutes = require("./api_routes/auth"); // ไฟล์ auth.js
const linenRoutes = require("./api_routes/tasks"); // ไฟล์ task.js (เช็คว่ามี s หรือไม่มี s)
const userRoutes = require("./api_routes/user");
const bodyParser = require("body-parser");
const app = express();


app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use("/api/auth", indexRoutes);
app.use("/api", linenRoutes);
app.use('/api/users', userRoutes);
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
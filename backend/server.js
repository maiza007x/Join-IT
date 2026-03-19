// backend/server.js
const express = require("express");
const app = express();

app.use(express.json());

app.post("/auth/login", (req, res) => {
  const { username } = req.body;
  res.json({ token: "123456" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
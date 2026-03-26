const bcrypt = require("bcrypt");
const db = require("../helper/db");

async function createAdmin() {
  try {
    // 🔍 เช็คก่อนว่ามี admin แล้วหรือยัง
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      "admin",
    ]);

    if (rows.length > 0) {
      console.log("⚠️ Admin already exists");
      return;
    }

    const hash = await bcrypt.hash("1234", 10);

    await db.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["admin", hash, "admin"]
    );

    console.log("✅ admin created (user: admin / pass: 1234)");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
  
    process.exit(0);
  }
}

createAdmin();

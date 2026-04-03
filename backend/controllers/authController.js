const bcrypt = require('bcrypt');
const db = require('../helper/db.js');
const jwt = require('jsonwebtoken');

// ใช้รหัสลับจาก env หรือค่า default
const JWT_SECRET = process.env.JWT_SECRET || "secret_key"; 

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password is required" });
    }

    const [results] = await db.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // ✅ แก้ไขจุดนี้: เปลี่ยนจาก 'secret' เป็นตัวแปร JWT_SECRET
    const token = jwt.sign({ id: user.id ,role: user.role}, JWT_SECRET, { expiresIn: '1d' });

    delete user.password;

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      status: true,
      data: user,
      token,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
  }
};

exports.getMe = async (req, res) => {
    try {
        // req.user.id คาดว่าน่าจะถูกแกะมาจาก middleware/auth.js ของคุณแล้ว
        const userId = req.user.id; 
        
        // สมมติว่าคุณใช้ mysql.js หรือ db.js ในการ query
        // ให้ดึงข้อมูลเฉพาะที่จำเป็น ไม่ต้องเอา password มานะครับ
        const [rows] = await db.query("SELECT id, username, role FROM users WHERE id = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }

        res.status(200).json({
            status: "success",
            data: rows[0] // ส่งข้อมูล id, username, role กลับไป
        });
    } catch (error) {
        console.error("Error in getMe:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน" });
    }
};
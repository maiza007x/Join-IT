const bcrypt = require('bcryptjs');
const db = require('../helper/db.js');
const jwt = require('jsonwebtoken');

// ใช้รหัสลับจาก env หรือค่า default
const JWT_SECRET = process.env.SECRET_ACCESS_TOKEN || "secret_key";

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
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

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

exports.register = async (req, res) => {
  const { username, password } = req.body;

  // ตรวจสอบเบื้องต้นว่าส่งข้อมูลมาครบไหม
  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  let conn;
  try {
    // ดึง Connection จาก Pool
    conn = await db.getConnection();

    // เช็คว่ามี Username นี้ในระบบหรือยัง
    const [rows] = await conn.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว' });
    }

    // ถ้ายังไม่มี ให้เข้ารหัส Password (ห้ามเซฟรหัสเป็นข้อความตรงๆ เพื่อความปลอดภัย)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // บันทึกข้อมูลลงฐานข้อมูล MySQL
    await conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    return res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });

  } catch (error) {
    console.error("🔴 Register Error:", error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ระบบหลังบ้าน' });
  } finally {
    // คืน Connection กลับเข้า Pool เสมอ
    if (conn) conn.release();
  }
}
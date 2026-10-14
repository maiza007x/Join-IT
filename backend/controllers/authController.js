const bcrypt = require('bcryptjs');
const db = require('../helper/db.js');
const jwt = require('jsonwebtoken');
const { validateInternshipInfo } = require('../helper/userFields');

const JWT_SECRET = process.env.SECRET_ACCESS_TOKEN;

const ACCOUNT_STATUS_MESSAGES = {
  pending: "บัญชีของคุณรอแอดมินอนุมัติ",
  rejected: "คำขอสมัครของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่",
  closed: "บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อเจ้าหน้าที่",
};

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

    // ตรวจสถานะบัญชีหลังตรวจรหัสผ่านแล้ว เพื่อไม่เปิดเผยสถานะให้คนที่ไม่รู้รหัสผ่าน
    if (user.status !== 'approved') {
      return res.status(403).json({ message: ACCOUNT_STATUS_MESSAGES[user.status] });
    }

    // ✅ แก้ไขจุดนี้: เปลี่ยนจาก 'secret' เป็นตัวแปร JWT_SECRET
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    delete user.password;

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      status: true,
      data: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        verified: user.verified,
        avatar_url: user.avatar_url
      },
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
    // ✅ แก้ไข: ดึง verified มาด้วย
    const [rows] = await db.query("SELECT id, username, role, verified, full_name, avatar_url FROM users WHERE id = ?", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    res.status(200).json({
      status: "success",
      data: rows[0]
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน" });
  }
};

exports.register = async (req, res) => {
  const {
    username, password, full_name, nickname, university_name,
    term, academic_year, internship_start_date, internship_end_date,
  } = req.body;

  const required = [username, password, full_name, nickname, university_name, term, academic_year, internship_start_date, internship_end_date];
  if (!required.every(Boolean)) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  const infoError = validateInternshipInfo({ term, internship_start_date, internship_end_date });
  if (infoError) {
    return res.status(400).json({ message: infoError });
  }

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // role และ status กำหนดที่ backend เสมอ ไม่รับจาก request
    await db.query(
      `INSERT INTO users
        (username, password, full_name, nickname, university_name, term, academic_year,
         internship_start_date, internship_end_date, role, status, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'pending', 0)`,
      [username, hashedPassword, full_name, nickname, university_name, term, academic_year,
       internship_start_date, internship_end_date]
    );

    return res.status(201).json({ message: "สมัครสมาชิกสำเร็จ กรุณารอแอดมินอนุมัติ" });
  } catch (error) {
    console.error("🔴 Register Error:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน" });
  }
};

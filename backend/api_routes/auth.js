const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // ตัวเข้ารหัส Password (อย่าลืมรัน npm install bcryptjs ที่ terminal ของ backend นะครับ)
const { joinPool } = require('../mysql'); // ดึงฐานข้อมูล Join-IT ของคุณมาใช้
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');
// 1. ทางเดินสำหรับเข้าสู่ระบบ (Login)
// ใช้ตัว authController.login ที่คุณทำไว้แต่แรกเลยครับ (จะปลอดภัยและเป็นระเบียบที่สุด)
router.post('/login', authController.login);

router.get('/getMe', authMiddleware, authController.getMe);
// 2. ทางเดินสำหรับสมัครสมาชิก (Register) ที่เราเพิ่มเข้ามาใหม่
// เส้นทางนี้เต็มๆ คือ POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // ตรวจสอบเบื้องต้นว่าส่งข้อมูลมาครบไหม
  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  let conn;
  try {
    // ดึง Connection จาก Pool
    conn = await joinPool.getConnection();

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
});

module.exports = router;
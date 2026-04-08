const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // ตัวเข้ารหัส Password (อย่าลืมรัน npm install bcryptjs ที่ terminal ของ backend นะครับ)
const { joinPool } = require('../mysql'); // ดึงฐานข้อมูล Join-IT ของคุณมาใช้
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// 1. ทางเดินสำหรับเข้าสู่ระบบ (Login)
// ใช้ตัว authController.login ที่คุณทำไว้แต่แรกเลยครับ (จะปลอดภัยและเป็นระเบียบที่สุด)
router.post('/login', authController.login);

router.get('/getMe', authMiddleware, authController.getMe);
// 2. ทางเดินสำหรับสมัครสมาชิก (Register) ที่เราเพิ่มเข้ามาใหม่
// เส้นทางนี้เต็มๆ คือ POST /api/auth/register
router.post('/register', authController.register);

module.exports = router;
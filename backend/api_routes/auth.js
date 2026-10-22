const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// กันการเดารหัสผ่าน: login ไม่สำเร็จได้ไม่เกิน 10 ครั้ง / 15 นาที ต่อ username
// นับตาม username (ไม่ใช่ IP) เพราะ backend อยู่หลัง IIS และ IP ของผู้ใช้ปลอมผ่าน header ได้
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => String(req.body.username ?? '').trim().toLowerCase(),
    message: { message: "เข้าสู่ระบบไม่สำเร็จหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่" },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

router.post('/login', loginLimiter, authController.login);
// เข้าจาก Order-IT ด้วยตั๋วใช้ครั้งเดียว (เจ้าหน้าที่)
router.post('/sso', authController.ssoLogin);
router.get('/getMe', authMiddleware, authController.getMe);
router.post('/register', authController.register);

module.exports = router;

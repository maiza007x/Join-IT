const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// --- 1. การตั้งค่า Multer (รูปโปรไฟล์) ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const userId = req.user ? req.user.id : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// --- 2. Routes ---

// [NEW] ดึงข้อมูลผู้ใช้ทั้งหมดเพื่อแสดงในหน้าจัดการสมาชิก
// แนะนำ: ควรมี Middleware ตรวจสอบว่าเป็น Admin หรือไม่ (ถ้ามี)
router.get('/all', authMiddleware, userController.getAllUsers); 

// ดูข้อมูลโปรไฟล์ตัวเอง
router.get('/me', authMiddleware, userController.getProfile);

// แก้ไขข้อมูลส่วนตัว
router.put('/me', authMiddleware, userController.updateProfile);

// เปลี่ยนรหัสผ่าน
router.put('/me/password', authMiddleware, userController.changePassword);

// อัปโหลดรูปโปรไฟล์
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

// บันทึกรายละเอียดการปฏิบัติงาน (Task Contribution)
router.post('/contributions', authMiddleware, userController.addTaskContribution);

module.exports = router;
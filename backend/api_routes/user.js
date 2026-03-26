const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// --- 1. การตั้งค่า Multer และสร้างโฟลเดอร์อัตโนมัติ ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // ตรวจสอบว่ามี req.user หรือไม่ (กันเหนื่อยถ้า middleware ทำงานพลาด)
        const userId = req.user ? req.user.id : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file && file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพ!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// --- 2. Routes ---

// ดูข้อมูลโปรไฟล์: GET /api/users/me
router.get('/me', authMiddleware, userController.getProfile);

// แก้ไขข้อมูลส่วนตัว: PUT /api/users/me
router.put('/me', authMiddleware, userController.updateProfile);

// เปลี่ยนรหัสผ่าน: PUT /api/users/me/password
router.put('/me/password', authMiddleware, userController.changePassword);

// อัปโหลดรูปโปรไฟล์: POST /api/users/upload-avatar
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);
// ตัวอย่างการเพิ่มใน routes
router.post('/contributions', authMiddleware, userController.addTaskContribution);
module.exports = router;
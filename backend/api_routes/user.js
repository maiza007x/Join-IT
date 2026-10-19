const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

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

// ดึงข้อมูลผู้ใช้ทั้งหมดเพื่อแสดงในหน้าจัดการสมาชิก
router.get('/all', authMiddleware, adminOnly, userController.getAllUsers); 

// รายการสมัครที่รออนุมัติ (admin)
router.get('/pending', authMiddleware, adminOnly, userController.getPendingUsers);

// ดึงรายชื่อนักศึกษาสำหรับตัวกรอง
router.get('/students', authMiddleware, userController.getStudentList); 

// ปิดบัญชีสมาชิก (admin)
router.put('/:id/close', authMiddleware, adminOnly, userController.closeUser);

// [NEW] แอดมินเพิ่มผู้ใช้
router.post('/add', authMiddleware, userController.addUser);

// [NEW] ปรับบทบาทของผู้ใชั
router.put('/:id/role', authMiddleware, userController.updateUserRole);

// [NEW] รีเซ็ตรหัสผ่านของผู้ใช้
router.put('/:id/reset-password', authMiddleware, userController.resetPassword);

// อนุมัติ / ปฏิเสธคำขอสมัคร (admin)
router.put('/:id/approve', authMiddleware, adminOnly, userController.approveUser);
router.put('/:id/reject', authMiddleware, adminOnly, userController.rejectUser);

// ดูข้อมูลโปรไฟล์ตัวเอง
router.get('/me', authMiddleware, userController.getProfile);

// เปลี่ยนรหัสผ่าน
router.put('/me/password', authMiddleware, userController.changePassword);

// อัปโหลดรูปโปรไฟล์
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

// บันทึกรายละเอียดการปฏิบัติงาน (Task Contribution)
router.post('/contributions', authMiddleware, userController.addTaskContribution);

// แอดมินแก้ข้อมูลนักศึกษา (ต้องอยู่หลัง /me และ /me/password เพื่อไม่ให้ /:id ดัก "me")
router.put('/:id', authMiddleware, adminOnly, userController.updateUserInfo);

module.exports = router;
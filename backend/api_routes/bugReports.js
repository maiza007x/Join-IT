const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const bugReportController = require('../controllers/bugReportController');

// --- การตั้งค่าอัปโหลดรูป (แนบในข้อความแจ้งปัญหา / วางจากคลิปบอร์ด) ---
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 5;
// ไม่รับ SVG เพราะฝังสคริปต์ได้; นามสกุลไฟล์ตั้งจากชนิดไฟล์ ไม่ใช้ชื่อไฟล์จากผู้ใช้
const IMAGE_EXTENSIONS = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

const uploadDir = path.join(__dirname, '../uploads/bug-reports');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${IMAGE_EXTENSIONS[file.mimetype]}`);
        },
    }),
    limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: MAX_IMAGES },
    fileFilter: (req, file, cb) => {
        cb(IMAGE_EXTENSIONS[file.mimetype] ? null : new Error('INVALID_IMAGE_TYPE'), true);
    },
});

const UPLOAD_ERROR_MESSAGES = {
    LIMIT_FILE_SIZE: `รูปภาพต้องมีขนาดไม่เกิน ${MAX_IMAGE_SIZE_MB}MB`,
    LIMIT_FILE_COUNT: `แนบรูปได้ไม่เกิน ${MAX_IMAGES} รูป`,
    LIMIT_UNEXPECTED_FILE: `แนบรูปได้ไม่เกิน ${MAX_IMAGES} รูป`,
    INVALID_IMAGE_TYPE: 'รองรับเฉพาะรูปภาพ PNG, JPEG, WebP และ GIF',
};

// ตอบ 400 พร้อมข้อความภาษาไทยเมื่อไฟล์ไม่ผ่าน (multer ลบไฟล์ที่ค้างจากคำขอนั้นให้เอง)
const uploadImages = (req, res, next) => {
    upload.array('images', MAX_IMAGES)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: UPLOAD_ERROR_MESSAGES[err.code || err.message] || 'อัปโหลดรูปภาพไม่สำเร็จ' });
        }
        next();
    });
};

router.get('/', auth, bugReportController.getBugReports);
router.post('/', auth, uploadImages, bugReportController.createBugReport);
router.delete('/:id', auth, bugReportController.deleteBugReport);

module.exports = router;

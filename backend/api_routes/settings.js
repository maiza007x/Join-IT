const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

const settingsPath = path.join(__dirname, '../settings.json');
const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `site-logo-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for logo
});

// อ่าน Settings (ไม่ต้องล็อคอิน เพราะ Login.jsx ต้องใช้)
router.get('/', (req, res) => {
    try {
        if (!fs.existsSync(settingsPath)) {
            return res.status(200).json({ data: { siteLogo: null } });
        }
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData || '{}');
        res.status(200).json({ data: settings });
    } catch (error) {
        console.error("Error reading settings:", error);
        res.status(500).json({ success: false, message: "Cannot read settings" });
    }
});

// อัปโหลด Website Logo (ต้องเป็น Admin เท่านั้น)
router.post('/upload-logo', authMiddleware, upload.single('logo'), (req, res) => {
    try {
        // ตรวจสอบสิทธิ์ (Admin หรือ Sub-admin ก็ได้ตามที่คุณอนุญาตในจัดการสมาชิก แต่ควรเป็น Role ที่ไว้ใจได้)
        // เพื่อความยืดหยุ่น ยอมให้ admin และ sub_admin แก้ไขได้ เหมือนการจัดการสมาชิก
        if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
            return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง (Admin only)' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'ไม่มีไฟล์อัปโหลด' });
        }

        const newLogoUrl = `/uploads/${req.file.filename}`;

        // อ่าน Settings ล่าสุด
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8') || '{}');
        }

        // ลบไฟล์โลโก้เดิมทิ้ง (ถ้ามี) เพื่อประหยัดพื้นที่
        if (settings.siteLogo) {
            const oldFilePath = path.join(__dirname, '..', settings.siteLogo);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // เซ็ตค่าใหม่
        settings.siteLogo = newLogoUrl;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

        res.status(200).json({
            success: true,
            message: 'อัปโหลดโลโก้สำเร็จ',
            siteLogo: newLogoUrl
        });

    } catch (error) {
        console.error("Error uploading logo:", error);
        res.status(500).json({ success: false, message: "Upload Error" });
    }
});

module.exports = router;

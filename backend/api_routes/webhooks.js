const express = require('express');
const router = express.Router();

// เส้นทางสำหรับรับข้อมูลจากโปรเจกต์ Order-IT (PHP)
router.post('/task-created', async (req, res) => {
    const { deviceName, report, username, time, secret } = req.body;
    const incomingSecret = req.headers['x-webhook-secret'];

    // ตรวจสอบความปลอดภัย (Shared Secret)
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "join-it-secret-2026";
    
    if (incomingSecret !== WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid Secret Key" });
    }

    try {
        const io = req.app.get('io');
        
        if (io) {
            console.log(`📡 [Webhook]: Received new task from Order-IT: ${deviceName}`);
            
            // ส่งสัญญาณ Socket ไปยัง Frontend ทุกคน
            io.emit('new-task', {
                deviceName,
                report,
                username,
                time: time || new Date().toLocaleTimeString('th-TH'),
                via: 'webhook' // ระบุว่ามาจาก Webhook
            });
            
            return res.json({ success: true, message: "Notification sent to interns" });
        } else {
            return res.status(500).json({ success: false, message: "Socket.io not initialized" });
        }
    } catch (err) {
        console.error("❌ [Webhook Error]:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;

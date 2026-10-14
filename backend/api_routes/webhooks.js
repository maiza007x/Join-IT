const express = require('express');
const router = express.Router();
const { notifyTaskById } = require('../helper/socketMonitor');

// รับสัญญาณจาก Order-IT เมื่อมีการสร้างงานใหม่ (body: { id })
// ถ้า webhook ไม่มา/ล้มเหลว polling ใน socketMonitor จะตามมาแจ้งเตือนให้เอง
router.post('/task-created', async (req, res) => {
    if (req.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid Secret Key" });
    }

    const id = Number(req.body.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: "id is required" });
    }

    try {
        await notifyTaskById(id);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ [Webhook Error]:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;

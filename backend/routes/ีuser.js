const express = require("express");
const router = express.Router();
const pool = require("../mysql");
const bcrypt = require("bcrypt"); // สำหรับ Hash รหัสผ่าน

// --- 1. GET /api/users/me (ดึงข้อมูลตัวเอง) ---
router.get("/me", async (req, res) => {
    try {
        // ดึงข้อมูล User ID 1 (ตัวอย่าง) พร้อมเปลี่ยนชื่อฟิลด์ให้ตรงกับ Frontend
        const [rows] = await pool.query(
            "SELECT id, username, full_name as fullName, role FROM users WHERE id = ?", 
            [1]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// --- 2. PUT /api/users/me (แก้ไขโปรไฟล์ + Whitelist + Validation) ---
router.put("/me", async (req, res) => {
    const { fullName } = req.body;

    // Validation: ห้ามว่าง
    if (!fullName || fullName.trim() === "") {
        return res.status(400).json({ message: "กรุณากรอกชื่อ - สกุล" });
    }

    try {
        // Whitelist: อัปเดตเฉพาะ full_name เท่านั้น (ป้องกันการแอบแก้ role หรือ id)
        const [result] = await pool.query(
            "UPDATE users SET full_name = ? WHERE id = ?", 
            [fullName.trim(), 1]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่สามารถอัปเดตได้" });
        }

        res.json({ message: "อัปเดตข้อมูลสำเร็จ ✅" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก", error: err.message });
    }
});

// --- 3. PUT /api/users/me/password (เปลี่ยนรหัสผ่าน + Verify + Hash) ---
router.put("/me/password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validation เบื้องต้น
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "กรุณากรอกรหัสผ่านให้ครบถ้วน" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    try {
        // 1. ดึงรหัสผ่านปัจจุบัน (ที่ Hash ไว้ใน DB) มาเช็ค
        const [users] = await pool.query("SELECT password FROM users WHERE id = ?", [1]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];

        // 2. Verify: ตรวจสอบรหัสผ่านเดิม (ใช้ bcrypt.compare)
        // หมายเหตุ: ถ้าใน DB คุณยังไม่ได้ Hash ให้ใช้ user.password !== currentPassword ไปก่อนชั่วคราว
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
        }

        // 3. Hash: เข้ารหัสผ่านใหม่ก่อนบันทึก
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // 4. Update: บันทึกลง Database
        await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, 1]);

        res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ ✅" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
    }
});

module.exports = router;
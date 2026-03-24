const pool = require('../mysql');
const bcrypt = require('bcrypt');

// --- 1. GET /api/users/me (ดึงข้อมูลโปรไฟล์) ---
exports.getProfile = async (req, res) => {
    try {
        console.log("User ID from Token:", req.user?.id); // ⬅️ เพิ่มบรรทัดนี้เช็กดูใน Terminal
        
        const [rows] = await pool.query(
            'SELECT id, username, full_name, university_name, academic_year, faculty, role, avatar_url FROM users WHERE id = ?', 
            [req.user.id]
        );
        // ... โค้ดที่เหลือ
// เอา role และ avatar_url ออกไปก่อนชั่วคราวเพื่อ Test

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
        }

        const user = rows[0];
        
        // แปลงชื่อจาก database (snake_case) เป็น camelCase เพื่อให้ React ใช้ง่ายขึ้น
        const responseData = {
            ...user,
            fullName: user.full_name // ส่ง fullName กลับไปให้ React
        };

        res.json(responseData); // ส่งก้อนข้อมูลตรงๆ ตามที่ fetchProfile ใน React รอรับ
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่ฐานข้อมูล" });
    }
};

// --- 2. PUT /api/users/me (อัปเดตข้อมูลส่วนตัว) ---
exports.updateProfile = async (req, res) => {
    // รองรับทั้งการส่งมาแบบ fullName (React) และ full_name (API Test)
    const { fullName, full_name, university_name, academic_year } = req.body;
    const finalName = fullName || full_name;

    if (!finalName || finalName.trim() === "") {
        return res.status(400).json({ success: false, message: "ชื่อ-นามสกุล ห้ามว่าง" });
    }

    try {
        await pool.query(
            'UPDATE users SET full_name = ?, university_name = ?, academic_year = ? WHERE id = ?',
            [finalName, university_name, academic_year, req.user.id]
        );
        res.json({ success: true, message: "อัปเดตข้อมูลโปรไฟล์สำเร็จ" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ success: false, message: "ไม่สามารถอัปเดตข้อมูลได้" });
    }
};

// --- 3. PUT /api/users/me/password (เปลี่ยนรหัสผ่าน) ---
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: "รหัสผ่านใหม่ไม่ตรงกัน" });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "รหัสผ่านใหม่ต้องมี 8 ตัวขึ้นไป" });
    }

    try {
        const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "รหัสผ่านเดิมไม่ถูกต้อง" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPwd, req.user.id]);
        res.json({ success: true, message: "เปลี่ยนรหัสผ่านเรียบร้อย" });
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({ success: false, message: "เปลี่ยนรหัสผ่านล้มเหลว" });
    }
};

// --- 4. POST /api/users/upload-avatar (อัปโหลดรูป) ---
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาเลือกไฟล์รูปภาพ" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        // อัปเดต DB
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [imageUrl, req.user.id]);

        res.json({ 
            success: true, 
            message: "อัปโหลดรูปโปรไฟล์สำเร็จ", 
            avatar_url: imageUrl 
        });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกรูปภาพ" });
    }
};
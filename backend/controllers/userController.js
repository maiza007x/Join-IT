// เปลี่ยนจาก const pool = require('../mysql'); เป็นแบบนี้:
const { query } = require('../mysql'); // ดึงมาเฉพาะ query
const joinPool = require('../helper/db'); 
const bcrypt = require('bcrypt');

// จากนั้นในฟังก์ชันต่างๆ ให้เปลี่ยนจาก pool.query เป็น query เฉยๆ
exports.getProfile = async (req, res) => {
    try {
        console.log("User ID from Token:", req.user?.id);
        
        // ใช้ db.query และเอา [ ] ออก เพราะฟังก์ชัน query ใน db.js คืนค่า rows มาให้เลย
        const[rows] = await joinPool.query(
            'SELECT id, username, full_name, university_name, academic_year, faculty, role, avatar_url FROM users WHERE id = ?', 
            [req.user.id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
        }

        const user = rows[0];
        
        const responseData = {
            ...user,
            fullName: user.full_name 
        };

        res.json(responseData);
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
// --- 5. POST /api/tasks/contributions (บันทึกการมีส่วนร่วมของเด็กฝึกงาน) ---
exports.addTaskContribution = async (req, res) => {
    const { 
        task_staff_id, 
        contribution_detail, 
        learning_outcome, 
        mentor_feedback 
    } = req.body;

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!task_staff_id) {
        return res.status(400).json({ success: false, message: "ไม่พบรหัสงานของเจ้าหน้าที่" });
    }

    try {
        // 1. ดึงชื่อคนทำจาก req.user (ที่ได้จาก middleware auth)
        // เราจะใช้ชื่อจาก DB เพื่อความแม่นยำ หรือใช้จาก token ก็ได้
        const [userRows] = await pool.query('SELECT full_name, username FROM users WHERE id = ?', [req.user.id]);
        if (userRows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        
        const creatorName = userRows[0].full_name || userRows[0].username;

        // 2. Insert ข้อมูลลงตาราง tasks
        const sql = `
            INSERT INTO tasks 
            (task_staff_id, intern_id, contribution_detail, learning_outcome, mentor_feedback, created_by, updated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            task_staff_id, 
            req.user.id, // intern_id คือคนที่ Login อยู่
            contribution_detail || null, 
            learning_outcome || null, 
            mentor_feedback || null, 
            creatorName, // created_by
            creatorName  // updated_by (ใส่ไว้ตอนสร้างครั้งแรก)
        ];

        const [result] = await pool.query(sql, values);

        res.status(201).json({ 
            success: true, 
            message: "บันทึกข้อมูลการช่วยงานสำเร็จ",
            contributionId: result.insertId 
        });

    } catch (err) {
        console.error("Add Task Contribution Error:", err);
        res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลการช่วยงานได้" });
    }
};
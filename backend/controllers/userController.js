const joinPool = require('../helper/db'); // ใช้ตัวแปรนี้เป็นหลัก
const bcrypt = require('bcrypt');

// --- 1. GET /api/users/me (ดึงข้อมูลโปรไฟล์) ---
exports.getProfile = async (req, res) => {
    try {
        console.log("User ID from Token:", req.user?.id);
        
        // ใช้ joinPool และ destruct [rows] ออกมา
        const [rows] = await joinPool.query(
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
    const { fullName, full_name, university_name, academic_year } = req.body;
    const finalName = fullName || full_name;

    if (!finalName || finalName.trim() === "") {
        return res.status(400).json({ success: false, message: "ชื่อ-นามสกุล ห้ามว่าง" });
    }

    try {
        // เปลี่ยนจาก pool เป็น joinPool
        await joinPool.query(
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
        // เปลี่ยนเป็น joinPool
        const [rows] = await joinPool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "รหัสผ่านเดิมไม่ถูกต้อง" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        await joinPool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPwd, req.user.id]);
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
        
        // เปลี่ยนเป็น joinPool
        await joinPool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [imageUrl, req.user.id]);

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

// --- 5. POST /api/tasks/contributions ---
exports.addTaskContribution = async (req, res) => {
    const { 
        task_staff_id, 
        contribution_detail, 
        learning_outcome, 
        mentor_feedback 
    } = req.body;

    if (!task_staff_id) {
        return res.status(400).json({ success: false, message: "ไม่พบรหัสงานของเจ้าหน้าที่" });
    }

    try {
        // เปลี่ยนเป็น joinPool
        const [userRows] = await joinPool.query('SELECT full_name, username FROM users WHERE id = ?', [req.user.id]);
        if (userRows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        
        const creatorName = userRows[0].full_name || userRows[0].username;

        const sql = `
            INSERT INTO tasks 
            (task_staff_id, intern_id, contribution_detail, learning_outcome, mentor_feedback, created_by, updated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            task_staff_id, 
            req.user.id, 
            contribution_detail || null, 
            learning_outcome || null, 
            mentor_feedback || null, 
            creatorName, 
            creatorName  
        ];

        // เปลี่ยนเป็น joinPool
        const [result] = await joinPool.query(sql, values);

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
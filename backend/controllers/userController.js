const joinPool = require('../helper/db'); // ใช้ตัวแปรนี้เป็นหลักในการเชื่อมต่อ DB
const bcrypt = require('bcrypt');

// --- 1. GET /api/users/me (ดึงข้อมูลโปรไฟล์ตัวเอง) ---
exports.getProfile = async (req, res) => {
    try {
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

// --- 2. GET /api/users/all (ดึงข้อมูลผู้ใช้ทั้งหมด - สำหรับหน้า Admin) ---
// ในไฟล์ controllers/userController.js
// --- 2. GET /api/users/all (ดึงข้อมูลผู้ใช้ทั้งหมด - สำหรับหน้า Admin) ---
exports.getAllUsers = async (req, res) => {
    try {
        // ใช้ Query ที่ปลอดภัยที่สุด (ถ้าตัวไหนไม่มีใน DB ให้ลบออกทีละตัวครับ)
        const [users] = await joinPool.query(`
            SELECT 
                id, 
                username, 
                full_name AS name, 
                role
            FROM users 
        `);
        // หมายเหตุ: ถ้าคุณรัน ALTER TABLE เพิ่ม created_at แล้ว 
        // สามารถเพิ่ม created_at เข้าไปใน SELECT ด้านบนได้ครับ

        res.status(200).json(users);
    } catch (error) {
        console.error("❌ SQL ERROR:", error.message); 
        res.status(500).json({ 
            success: false, 
            message: "Database Error", 
            detail: error.message 
        });
    }
};

// --- 3. PUT /api/users/me (อัปเดตข้อมูลส่วนตัว) ---
exports.updateProfile = async (req, res) => {
    const { fullName, full_name, university_name, academic_year } = req.body;
    const finalName = fullName || full_name;

    if (!finalName || finalName.trim() === "") {
        return res.status(400).json({ success: false, message: "ชื่อ-นามสกุล ห้ามว่าง" });
    }

    try {
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


// --- 4. PUT /api/users/me/password (เปลี่ยนรหัสผ่าน) ---
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

// --- 5. POST /api/users/upload-avatar (อัปโหลดรูปโปรไฟล์) ---
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาเลือกไฟล์รูปภาพ" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
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

// --- 6. POST /api/users/contributions (บันทึกรายละเอียดการปฏิบัติงานพร้อม 3 ฟิลด์ใหม่) ---
exports.addTaskContribution = async (req, res) => {
    const { 
        task_staff_id, 
        contribution_detail, // ได้ทำอะไรในงานนี้
        learning_outcome,    // สิ่งที่ได้เรียนรู้
        mentor_feedback      // คำแนะนำ (ถ้ามี)
    } = req.body;

    // ตรวจสอบฟิลด์บังคับ (ตัวอย่างคือ contribution_detail)
    if (!task_staff_id) {
        return res.status(400).json({ success: false, message: "ไม่พบรหัสงานของเจ้าหน้าที่" });
    }
    if (!contribution_detail || contribution_detail.trim() === "") {
        return res.status(400).json({ success: false, message: "กรุณากรอกรายละเอียดสิ่งที่ได้ทำ" });
    }

    try {
        // ดึงชื่อผู้บันทึกมาเก็บไว้ใน created_by / updated_by
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
            contribution_detail, 
            learning_outcome || null, 
            mentor_feedback || null, 
            creatorName, 
            creatorName  
        ];

        const [result] = await joinPool.query(sql, values);

        res.status(201).json({ 
            success: true, 
            message: "บันทึกข้อมูลสำเร็จแล้ว",
            contributionId: result.insertId 
        });

    } catch (err) {
        console.error("Add Task Contribution Error:", err);
        res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" });
    }
};


//เทส

//จบเทส

// 3. ฟังก์ชันลบยูสเซอร์ (ล็อกสิทธิ์เฉพาะ admin)
exports.deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        console.log("👉 ข้อมูล req.user ที่แกะมาจาก Token:", req.user);
        console.log("👉 Role ที่ระบบเห็น:", req.user?.role);
        const currentUserRole = req.user.role; // ข้อมูลบทบาทที่แกะมาจาก Token ตอน Login

        // 🔒 ล็อกสิทธิ์ขั้นสุด: ถ้าไม่ใช่แอดมิน ห้ามลบเด็ดขาด!
        if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบผู้ใช้งานระบบ" });
        }

        // ป้องกันแอดมินเผลอกดลบตัวเอง
        if (parseInt(userIdToDelete) === req.user.id) {
            return res.status(400).json({ message: "คุณไม่สามารถลบตัวเองได้นะ" });
        }

        const [result] = await joinPool.query("DELETE FROM users WHERE id = ?", [userIdToDelete]);

        if (result.affectedRows > 0) {
            return res.json({ status: "success", message: "ลบผู้ใช้สำเร็จ" });
        } else {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }
    } catch (error) {
        console.error("🔴 [Error] Failed to delete user:", error);
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
    }
};
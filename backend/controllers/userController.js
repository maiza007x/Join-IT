const joinPool = require('../helper/db'); // ใช้ตัวแปรนี้เป็นหลักในการเชื่อมต่อ DB
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { validateStudentInfo } = require('../helper/userFields');

// --- 1. GET /api/users/me (ดึงข้อมูลโปรไฟล์ตัวเอง) ---
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await joinPool.query(
            `SELECT id, username, full_name, nickname, university_name, education_level, academic_year, term, faculty, role, avatar_url, verified,
                    internship_start_date, internship_end_date
             FROM users WHERE id = ?`,
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

        // ✅ แก้ไข: ห่อข้อมูลด้วย 'data' ตามมาตรฐาน API อื่นๆ
        res.json({ success: true, data: responseData });
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่ฐานข้อมูล" });
    }
};

// --- 2. GET /api/users/all (ดึงข้อมูลผู้ใช้ทั้งหมด - สำหรับหน้า Admin) ---
exports.getAllUsers = async (req, res) => {
    try {
        // ใช้ Query ที่ปลอดภัยที่สุด (ถ้าตัวไหนไม่มีใน DB ให้ลบออกทีละตัวครับ)
        const [users] = await joinPool.query(`
            SELECT 
                id, 
                username, 
                full_name,
                avatar_url,
                updated_at,
                role,
                nickname,
                status,
                university_name,
                education_level,
                faculty,
                academic_year,
                term,
                internship_start_date,
                internship_end_date
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

// --- 2.1 GET /api/users/students (ดึงรายชื่อนักศึกษาสำหรับ Dropdown) ---
exports.getStudentList = async (req, res) => {
    try {
        const [students] = await joinPool.query(`
            SELECT id as value, full_name as label 
            FROM users
            WHERE status IN ('approved', 'closed')
            ORDER BY full_name ASC
        `);
        res.json({ success: true, data: students });
    } catch (err) {
        console.error("Get Student List Error:", err);
        res.status(500).json({ success: false, message: "ดึงข้อมูลรายชื่อล้มเหลว" });
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

        // ดึงข้อมูล avatar_url เดิม
        const [rows] = await joinPool.query('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
        if (rows && rows.length > 0 && rows[0].avatar_url) {
            const oldAvatar = rows[0].avatar_url;
            if (oldAvatar.startsWith('/uploads/')) {
                const oldFilePath = path.join(process.cwd(), oldAvatar);
                fs.unlink(oldFilePath, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.error("Failed to delete old avatar file:", err);
                    }
                });
            }
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

// 3. ปิดบัญชี (แทนการลบ เพื่อไม่ให้ประวัติงานในรายงานกำพร้า) - admin
exports.closeUser = async (req, res) => {
    const userId = Number(req.params.id);

    if (userId === req.user.id) {
        return res.status(400).json({ message: "คุณไม่สามารถปิดบัญชีตัวเองได้" });
    }

    try {
        const [result] = await joinPool.query(
            "UPDATE users SET status = 'closed' WHERE id = ? AND status = 'approved'",
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบบัญชีที่ใช้งานอยู่" });
        }
        res.json({ success: true, message: "ปิดบัญชีเรียบร้อย" });
    } catch (error) {
        console.error("Close User Error:", error);
        res.status(500).json({ message: "ปิดบัญชีไม่สำเร็จ" });
    }
};

exports.addUser = async (req, res) => {
    try {
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์เพิ่มผู้ใช้งาน" });
        }

        const { full_name, role, nickname, university_name, education_level, term, academic_year, internship_start_date, internship_end_date } = req.body;

        if (!full_name || !role) {
            return res.status(400).json({ message: "กรุณากรอกชื่อและบทบาทให้ครบถ้วน" });
        }

        const infoError = validateStudentInfo({ education_level, term, internship_start_date, internship_end_date });
        if (infoError) {
            return res.status(400).json({ message: infoError });
        }

        // หาเลขล่าสุดต่อจาก user...
        // ดึง username ที่ขึ้นต้นด้วย user แล้วดึงเลขออกมา
        const [rows] = await joinPool.query(`
            SELECT username FROM users 
            WHERE username REGEXP '^user[0-9]+$' 
            ORDER BY CAST(SUBSTRING(username, 5) AS UNSIGNED) DESC 
            LIMIT 1
        `);

        let nextNum = 1;
        if (rows.length > 0) {
            const lastUsername = rows[0].username;
            const lastNum = parseInt(lastUsername.substring(4), 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        const username = `user${nextNum}`;
        const plainPassword = username; // username = password เริ่มต้น
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        const sql = `INSERT INTO users
            (username, password, full_name, role, verified, status, nickname, university_name, education_level, term, academic_year, internship_start_date, internship_end_date)
            VALUES (?, ?, ?, ?, 0, 'approved', ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await joinPool.query(sql, [
            username, hashedPassword, full_name, role,
            nickname ?? null, university_name ?? null, education_level ?? null, term ?? null, academic_year ?? null,
            internship_start_date ?? null, internship_end_date ?? null,
        ]);

        res.status(201).json({
            success: true,
            message: "เพิ่มผู้ใช้งานสำเร็จ",
            data: { id: result.insertId, username, full_name, role }
        });

    } catch (error) {
        console.error("Add User Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน" });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;
        const currentUserRole = req.user.role;
        if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ในการแก้ไขการตั้งค่านี้" });
        }

        // ดึงข้อมูลผู้ใช้เป้าหมายก่อน
        const [targetUserRows] = await joinPool.query("SELECT role FROM users WHERE id = ?", [targetUserId]);
        if (targetUserRows.length === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานเป้าหมาย" });
        }

        await joinPool.query("UPDATE users SET role = ? WHERE id = ?", [role, targetUserId]);

        res.json({ success: true, message: "เปลี่ยนบทบาทสำเร็จ" });
    } catch (error) {
        console.error("Update Role Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท" });
    }
};

// 6. รีเซ็ตรหัสผ่าน (กลับไปเป็นค่าเดียวกับ username)
exports.resetPassword = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserRole = req.user.role;

        if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์รีเซ็ตรหัสผ่าน" });
        }

        // ดึงข้อมูล username เพื่อใช้เป็นรหัสผ่าน
        const [userRows] = await joinPool.query("SELECT username, role FROM users WHERE id = ?", [targetUserId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานระบบ" });
        }

        const targetUsername = userRows[0].username;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(targetUsername, salt);

        await joinPool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, targetUserId]);

        res.json({ success: true, message: "รีเซ็ตรหัสผ่านเป็น " + targetUsername + " เรียบร้อยแล้ว" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" });
    }
};

// --- 7. GET /api/users/pending (รายการสมัครที่รออนุมัติ - admin) ---
exports.getPendingUsers = async (req, res) => {
    try {
        const [users] = await joinPool.query(`
            SELECT id, username, full_name, nickname, university_name, education_level, term, academic_year,
                   internship_start_date, internship_end_date
            FROM users
            WHERE status = 'pending'
            ORDER BY id ASC
        `);
        res.json({ success: true, data: users });
    } catch (err) {
        console.error("Get Pending Users Error:", err);
        res.status(500).json({ success: false, message: "ดึงรายการรออนุมัติล้มเหลว" });
    }
};

// --- 8. PUT /api/users/:id/approve และ /reject (admin) ---
// ตัดสินได้เฉพาะคำขอที่ยังเป็น pending; อนุมัติแล้วถือว่ากรอกโปรไฟล์ครบ (verified = 1)
const decideRegistration = (status) => async (req, res) => {
    try {
        const [result] = await joinPool.query(
            `UPDATE users
             SET status = ?, approved_by = ?, approved_at = NOW(), verified = IF(? = 'approved', 1, verified)
             WHERE id = ? AND status = 'pending'`,
            [status, req.user.id, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบคำขอสมัครที่รออนุมัติ" });
        }
        res.json({ success: true, message: status === 'approved' ? "อนุมัติเรียบร้อย" : "ปฏิเสธคำขอเรียบร้อย" });
    } catch (err) {
        console.error("Decide Registration Error:", err);
        res.status(500).json({ success: false, message: "ดำเนินการไม่สำเร็จ" });
    }
};
exports.approveUser = decideRegistration('approved');
exports.rejectUser = decideRegistration('rejected');

// --- 9. PUT /api/users/:id (แอดมินแก้ข้อมูลนักศึกษา) ---
const EDITABLE_USER_FIELDS = [
    'full_name', 'nickname', 'university_name', 'education_level', 'term', 'academic_year',
    'internship_start_date', 'internship_end_date',
];

exports.updateUserInfo = async (req, res) => {
    const changes = EDITABLE_USER_FIELDS.filter((field) => req.body[field] !== undefined);
    if (changes.length === 0) {
        return res.status(400).json({ success: false, message: "ไม่มีข้อมูลที่ต้องการแก้ไข" });
    }
    if (changes.some((field) => !req.body[field])) {
        return res.status(400).json({ success: false, message: "ข้อมูลที่แก้ไขห้ามว่าง" });
    }

    try {
        const [rows] = await joinPool.query(
            'SELECT internship_start_date, internship_end_date FROM users WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }

        // ตรวจวันเริ่ม/สิ้นสุดโดยรวมค่าเดิมที่ไม่ได้ส่งมาแก้
        const infoError = validateStudentInfo({
            education_level: req.body.education_level,
            term: req.body.term,
            internship_start_date: req.body.internship_start_date ?? rows[0].internship_start_date,
            internship_end_date: req.body.internship_end_date ?? rows[0].internship_end_date,
        });
        if (infoError) {
            return res.status(400).json({ success: false, message: infoError });
        }

        await joinPool.query(
            `UPDATE users SET ${changes.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`,
            [...changes.map((field) => req.body[field]), req.params.id]
        );
        res.json({ success: true, message: "แก้ไขข้อมูลเรียบร้อย" });
    } catch (err) {
        console.error("Update User Info Error:", err);
        res.status(500).json({ success: false, message: "แก้ไขข้อมูลไม่สำเร็จ" });
    }
};

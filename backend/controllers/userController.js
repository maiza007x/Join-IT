const joinPool = require('../helper/db'); // ใช้ตัวแปรนี้เป็นหลักในการเชื่อมต่อ DB
const bcrypt = require('bcrypt');

// --- 1. GET /api/users/me (ดึงข้อมูลโปรไฟล์ตัวเอง) ---
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await joinPool.query(
            'SELECT id, username, full_name, university_name, academic_year, term, faculty, role, avatar_url, verified FROM users WHERE id = ?',
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
                university_name,
                academic_year,
                term
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
            ORDER BY full_name ASC
        `);
        res.json({ success: true, data: students });
    } catch (err) {
        console.error("Get Student List Error:", err);
        res.status(500).json({ success: false, message: "ดึงข้อมูลรายชื่อล้มเหลว" });
    }
};

// --- 3. PUT /api/users/me (อัปเดตข้อมูลส่วนตัว) ---
exports.updateProfile = async (req, res) => {
    const { fullName, full_name, university_name, academic_year, term } = req.body;
    const finalName = fullName || full_name;

    if (!finalName || finalName.trim() === "") {
        return res.status(400).json({ success: false, message: "ชื่อ-นามสกุล ห้ามว่าง" });
    }

    try {
        await joinPool.query(
            'UPDATE users SET full_name = ?, university_name = ?, academic_year = ?, term = ? WHERE id = ?',
            [finalName, university_name, academic_year, term, req.user.id]
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

// --- 4.1 POST /api/users/verify-profile (ยืนยันตัวตนครั้งแรก) ---
exports.verifyProfile = async (req, res) => {
    const { full_name, university_name, academic_year, term, password } = req.body;

    if (!full_name || !university_name || !academic_year || !term || !password) {
        return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `
            UPDATE users 
            SET full_name = ?, 
                university_name = ?, 
                academic_year = ?, 
                term = ?, 
                password = ?, 
                verified = 1 
            WHERE id = ?
        `;
        
        await joinPool.query(sql, [full_name, university_name, academic_year, term, hashedPassword, req.user.id]);

        res.json({ success: true, message: "ตั้งค่าโปรไฟล์สำเร็จ พร้อมเริ่มใช้งานระบบ" });
    } catch (err) {
        console.error("Verify Profile Error:", err);
        res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลการยืนยันตัวตนได้" });
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

// 4. แอดมินเพิ่มผู้ใช้
exports.addUser = async (req, res) => {
    try {
        const currentUserRole = req.user.role;
        // ป้องกันสิทธิ์: admin หรือ sub_admin เท่านั้น
        if (currentUserRole !== 'admin' && currentUserRole !== 'sub_admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์เพิ่มผู้ใช้งาน" });
        }

        const { full_name, role } = req.body;

        if (!full_name || !role) {
            return res.status(400).json({ message: "กรุณากรอกชื่อและบทบาทให้ครบถ้วน" });
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

        const sql = `INSERT INTO users (username, password, full_name, role, verified) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await joinPool.query(sql, [username, hashedPassword, full_name, role, 0]);

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

// 5. เปลี่ยนบทบาทผู้ใช้
exports.updateUserRole = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body; // 'admin', 'sub_admin', 'user'
        const currentUserRole = req.user.role;

        if (currentUserRole !== 'admin' && currentUserRole !== 'sub_admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ในการแก้ไขการตั้งค่านี้" });
        }

        // ดึงข้อมูลผู้ใช้เป้าหมายก่อน
        const [targetUserRows] = await joinPool.query("SELECT role FROM users WHERE id = ?", [targetUserId]);
        if (targetUserRows.length === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานเป้าหมาย" });
        }

        const targetUserCurrentRole = targetUserRows[0].role;

        // ถ้าระบบอนุญาตให้ sub_admin จัดการได้ แต่ห้ามแก้ไข admin ให้เป็นค่าอื่น
        if (currentUserRole === 'sub_admin' && targetUserCurrentRole === 'admin') {
            return res.status(403).json({ message: "แอดมินรอง ไม่สามารถแก้ไขสิทธิ์ของแอดมินหลักได้" });
        }

        // ถ้า sub_admin จะตั้งคนอื่นเป็น admin? ปกติ sub_admin ไม่น่าจะตั้งคนเป็น admin ได้
        if (currentUserRole === 'sub_admin' && role === 'admin') {
            return res.status(403).json({ message: "แอดมินรอง ไม่สามารถตั้งค่าผู้อื่นเป็นแอดมินหลักได้" });
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

        if (currentUserRole !== 'admin' && currentUserRole !== 'sub_admin') {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์รีเซ็ตรหัสผ่าน" });
        }

        // ดึงข้อมูล username เพื่อใช้เป็นรหัสผ่าน
        const [userRows] = await joinPool.query("SELECT username, role FROM users WHERE id = ?", [targetUserId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานระบบ" });
        }

        const targetUsername = userRows[0].username;
        const targetRole = userRows[0].role;

        if (currentUserRole === 'sub_admin' && targetRole === 'admin') {
            return res.status(403).json({ message: "แอดมินรอง ไม่สามารถรีเซ็ตรหัสผ่านของแอดมินหลักได้" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(targetUsername, salt);

        await joinPool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, targetUserId]);

        res.json({ success: true, message: "รีเซ็ตรหัสผ่านเป็น " + targetUsername + " เรียบร้อยแล้ว" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" });
    }
};
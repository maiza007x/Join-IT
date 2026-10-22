const bcrypt = require('bcryptjs');
const { query } = require('./db');

// บัญชีเจ้าหน้าที่ IT อยู่ในตาราง admin ของ Order-IT (รหัสผ่านเป็นของ Order-IT; Join-IT ตรวจอย่างเดียว)
async function findOrderItStaff(username) {
    const [rows] = await query(
        'SELECT username, password, fname, lname, nickname, is_active FROM admin WHERE username = ? LIMIT 1',
        [username],
        'order'
    );
    return rows[0] ?? null;
}

// รหัสผ่านที่ไม่ใช่ bcrypt (เช่น บันทึกจากหน้าตั้งค่าของ Order-IT แบบไม่เข้ารหัส) bcryptjs คืน false = login ไม่ได้
const verifyStaffPassword = (staff, password) => bcrypt.compare(password, staff.password);

// สร้าง/อัปเดตแถวเจ้าหน้าที่ใน users ของ Join-IT (ผูกด้วย orderit_username) แล้วคืนแถวนั้น
// token ของ Join-IT ใช้ id ของแถวนี้ ไม่ใช้ id ของ Order-IT เพื่อกัน id สองระบบชนกัน
async function upsertStaffUser(staff) {
    await query(
        `INSERT INTO users (username, orderit_username, password, full_name, nickname, role, status, verified)
         VALUES (?, ?, '', ?, ?, 'admin', 'approved', 1)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), nickname = VALUES(nickname), status = 'approved'`,
        [staff.username, staff.username, `${staff.fname} ${staff.lname}`.trim(), staff.nickname || null]
    );
    const [rows] = await query('SELECT * FROM users WHERE orderit_username = ?', [staff.username]);
    return rows[0];
}

module.exports = { findOrderItStaff, verifyStaffPassword, upsertStaffUser };

const jwt = require('jsonwebtoken');
const { query } = require('../helper/db');
const JWT_SECRET = process.env.SECRET_ACCESS_TOKEN;

async function auth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log("❌ No Token Found in Header");
        return res.sendStatus(401);
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET); // มีทั้ง id และ role
    } catch (err) {
        console.log("❌ JWT Verify Error:", err.message);
        return res.sendStatus(403);
    }

    // token ยังไม่หมดอายุ แต่บัญชีอาจถูกปิดไปแล้ว
    const [rows] = await query('SELECT status, orderit_username FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0 || rows[0].status !== 'approved') {
        return res.status(403).json({ message: "บัญชีนี้ไม่สามารถใช้งานได้" });
    }

    // เจ้าหน้าที่จาก Order-IT: ตัดสิทธิ์ทันทีเมื่อถูกปิดใช้งานหรือลบใน Order-IT (ไม่ต้องรอ token หมดอายุ)
    if (rows[0].orderit_username) {
        const [staff] = await query('SELECT is_active FROM admin WHERE username = ?', [rows[0].orderit_username], 'order');
        if (staff.length === 0 || !staff[0].is_active) {
            return res.status(403).json({ message: "บัญชีเจ้าหน้าที่นี้ถูกปิดใช้งานใน Order-IT" });
        }
    }

    next();
}

module.exports = auth;

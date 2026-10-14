// ใช้ต่อจาก middleware/auth.js
function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง (Admin only)" });
    }
    next();
}

module.exports = adminOnly;

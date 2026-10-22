// ใช้ต่อจาก middleware/auth.js: ผูก/รับงานได้เฉพาะนักศึกษา (role user)
// แอดมินและเจ้าหน้าที่ดูได้อย่างเดียว เพื่อไม่ให้ปนกับสถิติของนักศึกษา
function internOnly(req, res, next) {
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: "ผูกงาน/รับงานได้เฉพาะนักศึกษาฝึกงาน" });
    }
    next();
}

module.exports = internOnly;

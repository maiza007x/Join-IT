const jwt = require('jsonwebtoken');
// 1. ประกาศตัวแปรให้ตรงกับใน authController.js
const JWT_SECRET = process.env.JWT_SECRET || "secret_key"; 

function auth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
// ที่ด้านบนของไฟล์ tasks.js
    const { authenticateToken } = require('../middleware/auth');
    if (!token) {
        console.log("❌ No Token Found in Header");
        return res.sendStatus(401); 
    }

    // 2. เปลี่ยนจาก 'secret' เป็นตัวแปร JWT_SECRET
    jwt.verify(token, JWT_SECRET, (err, user) => { 
        if (err) {
            console.log("❌ JWT Verify Error:", err.message);
            return res.sendStatus(403); 
        }
        
        req.user = user; 
        next();
    });
}

module.exports = auth;
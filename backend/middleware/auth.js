const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.SECRET_ACCESS_TOKEN || "secret_key";

function auth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log("❌ No Token Found in Header");
        return res.sendStatus(401);
    }

    try {
        // ใช้แบบ Synchronous หรือมี Callback ก็ได้ครับ
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // ตรงนี้จะมีทั้ง id และ role โผล่มาแล้ว
        next();
    } catch (err) {
        console.log("❌ JWT Verify Error:", err.message);
        return res.sendStatus(403);
    }
}

module.exports = auth;
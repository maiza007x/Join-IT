const bcrypt = require('bcrypt');
const db = require('../helper/db.js')
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password is required" });
    }

    const [results] = await db.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { username: user.username, id: user.id },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    delete user.password;

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      status: true,
      data: user,
      token,
    });

  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
  }
};
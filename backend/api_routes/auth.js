const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/getMe', authMiddleware, authController.getMe);
router.post('/register', authController.register); //ไม่ใช้แล้ว

module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

router.post('/login', authController.login);
// router.post('/login', (req, res) => {
//   const { username } = req.body;

//   const token = jwt.sign({ username }, 'secret');
//   res.json({ token });
// });

module.exports = router;
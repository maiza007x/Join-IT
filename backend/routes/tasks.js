const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET
router.get('/', auth, (req, res) => {
  db.query('SELECT * FROM tasks', (err, result) => {
    res.json(result);
  });
});

// POST
router.post('/', auth, (req, res) => {
  const { title } = req.body;
  db.query('INSERT INTO tasks (title) VALUES (?)', [title]);
  res.json({ message: 'created' });
});

// JOIN TASK
router.post('/:id/join', auth, (req, res) => {
  res.json({ message: 'joined task' });
});

module.exports = router;
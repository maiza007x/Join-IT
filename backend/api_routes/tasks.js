const express = require('express');
const router = express.Router();
const db = require('../mysql');
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

router.get("/tasks", (req, res) => {
  res.json([
    { id: 1, title: "งาน 1" },
    { id: 2, title: "งาน 2" }
  ]);
});

module.exports = router;

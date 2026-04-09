const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// --- 1. GET /api/tasks/tasks_collab (ดึงงานหน้าหลัก - Tasks.jsx) ---
router.get('/tasks_collab', auth, taskController.getTasksCollab);

// --- 2. GET /api/tasks/my-tasks (ดึงงานของฉัน - MyTasks.jsx) ---
router.get('/my-tasks', auth, taskController.getMyTasks);

// --- 3. PUT /api/tasks/contribution/:id (อัปเดตข้อมูลรายละเอียดงาน) ---
router.put('/contribution/:id', auth, taskController.updateContribution);

// --- 4. POST /api/tasks/join (กดเข้าร่วมงาน) ---
router.post('/join', auth, taskController.joinTask);

// --- 5. DELETE /api/tasks/leave/:id (ยกเลิกการเข้าร่วม - Soft Delete) ---
router.delete('/leave/:id', auth, taskController.leaveTask);

// --- 6. GET /api/tasks/analytics-stats (ข้อมูลสถิติกราฟ Dashboard) ---
router.get('/analytics-stats', auth, taskController.getAnalyticsStats);

module.exports = router;
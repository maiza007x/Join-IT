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

// --- 6.1 GET /api/tasks/workload-chart (ข้อมูลกราฟ Workload รายคน/รายวัน) ---
router.get('/workload-chart', auth, taskController.getWorkloadChartData);

// --- 6.2 GET /api/tasks/workload-filters (ดึงข้อมูลตัวเลือกสำหรับ Local Filter ของ Workload) ---
router.get('/workload-filters', auth, taskController.getWorkloadFilters);

// --- 7. GET /api/tasks/form-options (ดึงข้อมูลตัวเลือกสำหรับฟอร์มสร้างงาน) ---
router.get('/form-options', auth, taskController.getFormOptions);

// --- 8. POST /api/tasks/create-intern-task (สร้างงานใหม่โดยนักศึกษา) ---
router.post('/create-intern-task', auth, taskController.createInternTask);

// --- 9. PUT /api/tasks/accept-intern/:id (รับงานนักศึกษา) ---
router.put('/accept-intern/:id', auth, taskController.acceptInternTask);

// --- 10. PUT /api/tasks/leave-intern/:id (ยกเลิกการรับงานนักศึกษา) ---
router.put('/leave-intern/:id', auth, taskController.leaveInternTask);

// --- 11. PUT /api/tasks/intern-details/:id (อัปเดตรายละเอียดงานนักศึกษา) ---
router.put('/intern-details/:id', auth, taskController.updateInternTaskDetails);

// --- 12. PUT /api/tasks/close-intern/:id (ปิดงานนักศึกษา/เสร็จสิ้น) ---
router.put('/close-intern/:id', auth, taskController.closeInternTask);

module.exports = router;
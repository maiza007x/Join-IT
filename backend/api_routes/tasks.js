const express = require('express');
const router = express.Router();
const joinPool = require('../helper/db');
const auth = require('../middleware/auth');

// --- 1. GET /api/tasks/tasks_collab (ดึงงานหน้าหลัก - Tasks.jsx) ---
router.get('/tasks_collab', auth, async (req, res) => {
    const { date, q } = req.query;
    
    // ล็อควันที่ให้เป็นเวลาไทย (Asia/Bangkok) เพื่อให้ตรงกับหน้าเว็บ 2026-04-02
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const targetDate = date || today;
    const userId = req.user.id;

    try {
        /**
         * 💡 จุดสำคัญ: 
         * 1. ใช้ DATE(r.date_report) เพื่อให้เทียบแค่วันที่ ไม่เอาเวลามาเกี่ยว
         * 2. ใช้ ORDER BY r.id DESC เพื่อให้งานใหม่ล่าสุด (เช่น ID 10765) ขึ้นก่อน
         */
        let sql = `
            SELECT 
                r.id as id,
                r.deviceName,
                r.report,
                r.time_report,
                r.date_report,
                GROUP_CONCAT(t.created_by) as intern_names,
                MAX(CASE WHEN t.intern_id = ? AND t.deleted_at IS NULL THEN 1 ELSE 0 END) as isContributedByMe
            FROM orderit.data_report r
            LEFT JOIN join_it.tasks t ON r.id = t.task_staff_id AND t.deleted_at IS NULL
            WHERE DATE(r.date_report) = ?
        `;
        
        const params = [userId, targetDate];

        if (q) {
            sql += ` AND (r.report LIKE ? OR r.deviceName LIKE ?)`;
            const search = `%${q}%`;
            params.push(search, search);
        }

        sql += ` GROUP BY r.id ORDER BY r.id DESC`; 

        const [rows] = await joinPool.query(sql, params);
        
        // แปลงข้อมูลรูปแบบ interns ให้ Frontend ใช้งานได้
        const formattedTasks = rows.map(task => ({
            ...task,
            interns: task.intern_names ? [...new Set(task.intern_names.split(','))] : [],
            isContributedByMe: !!task.isContributedByMe
        }));

        res.json({ success: true, tasks: formattedTasks });
    } catch (err) {
        console.error("❌ Tasks Collab Error:", err.message);
        res.status(500).json({ success: false, message: "โหลดข้อมูลงานล้มเหลว" });
    }
});

// --- 2. GET /api/tasks/my-tasks (ดึงงานของฉัน - MyTasks.jsx) ---
router.get('/my-tasks', auth, async (req, res) => {
    try {
        const userId = req.user.id; 
        const sql = `
            SELECT 
                t.id as contribution_id, 
                t.task_staff_id,
                t.contribution_detail,
                t.learning_outcome,
                t.mentor_feedback,
                DATE_FORMAT(r.date_report, '%Y-%m-%d') as date_report,
                r.deviceName, 
                r.report
            FROM join_it.tasks t
            LEFT JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE t.intern_id = ? AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
        `;
        const [rows] = await joinPool.query(sql, [userId]);
        res.json({ success: true, tasks: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "ดึงข้อมูลงานของฉันล้มเหลว" });
    }
});

// --- 3. PUT /api/tasks/contribution/:id (บันทึกข้อมูล 3 ฟิลด์ใหม่) ---
router.put('/contribution/:id', auth, async (req, res) => {
    const contributionId = req.params.id;
    const { contribution_detail, learning_outcome, mentor_feedback } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await joinPool.query(
            `UPDATE join_it.tasks 
             SET contribution_detail = ?, 
                 learning_outcome = ?, 
                 mentor_feedback = ?,
                 updated_at = NOW() 
             WHERE id = ? AND intern_id = ?`,
            [contribution_detail, learning_outcome, mentor_feedback, contributionId, userId]
        );
        res.json({ success: true, message: "บันทึกสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: "บันทึกล้มเหลว" });
    }
});

// --- 4. POST /api/tasks/join (กดเข้าร่วมงาน) ---
router.post('/join', auth, async (req, res) => {
    const { task_staff_id } = req.body;
    const intern_id = req.user.id;
    try {
        const [userRows] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        const creatorName = userRows[0].full_name;

        await joinPool.query(
            `INSERT INTO join_it.tasks (task_staff_id, intern_id, created_by, created_at) 
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()`,
            [task_staff_id, intern_id, creatorName]
        );
        res.status(201).json({ success: true, message: 'เข้าร่วมเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ success: false, message: "บันทึกข้อมูลล้มเหลว" });
    }
});

// --- 5. DELETE /api/tasks/leave/:id (ยกเลิกการเข้าร่วม) ---
router.delete('/leave/:id', auth, async (req, res) => {
    const task_staff_id = req.params.id;
    const intern_id = req.user.id;
    try {
        await joinPool.query(
            'UPDATE join_it.tasks SET deleted_at = NOW() WHERE task_staff_id = ? AND intern_id = ?',
            [task_staff_id, intern_id]
        );
        res.json({ success: true, message: "ยกเลิกเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ message: "ล้มเหลว" });
    }
});

module.exports = router;
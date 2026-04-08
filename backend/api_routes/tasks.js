const express = require('express');
const router = express.Router();
const joinPool = require('../helper/db');
const auth = require('../middleware/auth');

// --- 1. GET /api/tasks/tasks_collab (ดึงงานหน้าหลัก - Tasks.jsx) ---
router.get('/tasks_collab', auth, async (req, res) => {
    const { date, q } = req.query;

    // ล็อควันที่ให้เป็นเวลาไทย (Asia/Bangkok)
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const targetDate = date || today;
    const userId = req.user.id;

    try {
        let sql = `
            SELECT 
                r.id as id,
                r.deviceName,
                r.report,
                r.time_report,
                r.date_report,
                r.username,
                /* ดึงชื่อเต็มจากตาราง users โดยใช้ DISTINCT เพื่อป้องกันชื่อซ้ำ และใช้ separator ที่ปลอดภัย */
                GROUP_CONCAT(DISTINCT u.full_name SEPARATOR '||') as intern_names,
                MAX(CASE WHEN t.intern_id = ? AND t.deleted_at IS NULL THEN 1 ELSE 0 END) as isContributedByMe
            FROM orderit.data_report r
            LEFT JOIN join_it.tasks t ON r.id = t.task_staff_id AND t.deleted_at IS NULL
            LEFT JOIN join_it.users u ON t.intern_id = u.id
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

        const formattedTasks = rows.map(task => ({
            ...task,
            // แปลง String ของชื่อที่คั่นด้วย || ให้เป็น Array
            interns: task.intern_names ? task.intern_names.split('||') : [],
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
        const { date, q } = req.query;

        let sql = `
            SELECT 
                t.id as contribution_id, 
                t.task_staff_id,
                t.contribution_detail,
                t.learning_outcome,
                t.mentor_feedback,
                DATE_FORMAT(r.date_report, '%Y-%m-%d') as date_report,
                r.time_report,
                r.deviceName, 
                r.report
            FROM join_it.tasks t
            LEFT JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE t.intern_id = ? AND t.deleted_at IS NULL
        `;
        const params = [userId];

        if (date) {
            sql += ` AND DATE(r.date_report) = ?`;
            params.push(date);
        }

        if (q) {
            sql += ` AND (r.report LIKE ? OR r.deviceName LIKE ?)`;
            const search = `%${q}%`;
            params.push(search, search);
        }

        sql += ` ORDER BY t.created_at DESC`;

        const [rows] = await joinPool.query(sql, params);
        res.json({ success: true, tasks: rows });
    } catch (err) {
        console.error("❌ My Tasks Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลงานของฉันล้มเหลว" });
    }
});

// --- 3. PUT /api/tasks/contribution/:id (อัปเดตข้อมูลรายละเอียดงาน) ---
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
        // ดึงชื่อผู้ใช้มาเก็บใน created_by (เพื่อเก็บ Snapshot ชื่อ ณ ตอนบันทึก)
        const [userRows] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        if (userRows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
        
        const creatorName = userRows[0].full_name;

        await joinPool.query(
            `INSERT INTO join_it.tasks (task_staff_id, intern_id, created_by, created_at) 
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()`,
            [task_staff_id, intern_id, creatorName]
        );
        res.status(201).json({ success: true, message: 'เข้าร่วมเรียบร้อย' });
    } catch (err) {
        console.error("❌ Join Task Error:", err.message);
        res.status(500).json({ success: false, message: "บันทึกข้อมูลล้มเหลว" });
    }
});

// --- 5. DELETE /api/tasks/leave/:id (ยกเลิกการเข้าร่วม - Soft Delete) ---
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
        res.status(500).json({ success: false, message: "ล้มเหลว" });
    }
});

module.exports = router;
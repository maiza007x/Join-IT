const express = require('express');
const router = express.Router();
const db = require('../mysql'); 
const joinPool = require('../helper/db');
const auth = require('../middleware/auth');
const taskContributionController = require('../controllers/taskContributionController');

// --- 1. GET /api/tasks/tasks_collab ---
router.get('/tasks_collab', auth, taskContributionController.getTasks);

// --- 2. GET /api/tasks/my-tasks (ดึงงานที่ฉันเข้าร่วม) ---
router.get('/my-tasks', auth, async (req, res) => {
    try {
        const userId = req.user.id; 
        
        /**
         * ใช้ LEFT JOIN เพื่อความปลอดภัย:
         * ถ้าหา database 'orderit' หรือตาราง 'data_report' ไม่เจอ 
         * ระบบจะยังคืนค่าข้อมูลจากตาราง tasks มาให้ (แต่ชื่ออุปกรณ์จะเป็น null) ทำให้หน้าเว็บไม่ล่ม (500)
         */
        const sql = `
            SELECT 
                t.id as contribution_id, 
                t.task_staff_id,
                t.contribution_detail	 as contribution_note,
                DATE_FORMAT(t.created_at, '%Y-%m-%d') as date_report,
                r.deviceName, 
                r.report
            FROM join_it.tasks t
            LEFT JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE t.intern_id = ?
            ORDER BY t.created_at DESC
        `;
        
        const [rows] = await joinPool.query(sql, [userId]);
        res.json({ success: true, tasks: rows });
    } catch (err) {
        console.error("MyTasks Error:", err);
        // หากเกิด Error เรื่อง Join ข้าม DB ให้ดึงแค่ตารางเดียวเป็นแผนสำรอง (Fallback)
        try {
            const [backupRows] = await joinPool.query('SELECT *, id as contribution_id FROM join_it.tasks WHERE intern_id = ?', [userId]);
            res.json({ success: true, tasks: backupRows, warning: "Database linkage issue" });
        } catch (backupErr) {
            res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
    }
});

// --- 3. PUT /api/tasks/contribution/:id (บันทึกสิ่งที่เรียนรู้) ---
// เพิ่มส่วนนี้เพื่อให้หน้า MyTasks.jsx สามารถกดเซฟ Note ได้
router.put('/contribution/:id', auth, async (req, res) => {
    const contributionId = req.params.id;
    const { note } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await joinPool.query(
            'UPDATE join_it.tasks SET note = ? WHERE id = ? AND intern_id = ?',
            [note, contributionId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการบันทึก" });
        }

        res.json({ success: true, message: "บันทึกสำเร็จ" });
    } catch (err) {
        console.error("Update Note Error:", err);
        res.status(500).json({ success: false, message: "บันทึกล้มเหลว" });
    }
});

// --- 4. GET / (ดึงรายการงานทั้งหมดตามวันที่) ---
router.get('/', auth, async (req, res) => {
    const { date, q } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const userId = req.user.id;

    try {
        let sql = `
            SELECT 
                task_staff_id, 
                MAX(created_at) as created_at,
                GROUP_CONCAT(created_by) as intern_names,
                MAX(CASE WHEN intern_id = ? THEN 1 ELSE 0 END) as isContributedByMe
            FROM join_it.tasks
            WHERE DATE(created_at) = ?
        `;
        
        const params = [userId, targetDate];

        if (q) {
            sql += ` AND (created_by LIKE ?)`; // ปรับให้ค้นหาจากชื่อผู้บันทึก
            const search = `%${q}%`;
            params.push(search);
        }

        sql += ` GROUP BY task_staff_id ORDER BY created_at DESC`;

        const [rows] = await joinPool.query(sql, params);
        
        const formattedTasks = rows.map(task => ({
            ...task,
            id: task.task_staff_id, 
            interns: task.intern_names ? [...new Set(task.intern_names.split(','))] : [],
            isContributedByMe: !!task.isContributedByMe
        }));

        res.json({ success: true, tasks: formattedTasks });
    } catch (err) {
        console.error("Get Tasks Error:", err);
        res.status(500).json({ success: false, message: "โหลดข้อมูลงานล้มเหลว" });
    }
});

// --- 5. POST /api/tasks/join (กดมีส่วนร่วม) ---
router.post('/join', auth, async (req, res) => {
    const { task_staff_id } = req.body;
    const intern_id = req.user.id;

    if (!task_staff_id) {
        return res.status(400).json({ message: "กรุณาระบุ task_staff_id" });
    }

    try {
        const [userRows] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        if (userRows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        
        const creatorName = userRows[0].full_name;

        await joinPool.query(
            'INSERT INTO join_it.tasks (task_staff_id, intern_id, created_by, created_at) VALUES (?, ?, ?, NOW())',
            [task_staff_id, intern_id, creatorName]
        );
        res.status(201).json({ success: true, message: 'เข้าร่วมงานเรียบร้อย' });
    } catch (err) {
        console.error("Join Task Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
    }
});

// --- 6. DELETE /api/tasks/leave/:id (ยกเลิกการมีส่วนร่วม) ---
router.delete('/leave/:id', auth, async (req, res) => {
    const task_staff_id = req.params.id;
    const intern_id = req.user.id;

    try {
        const [result] = await joinPool.query(
            'DELETE FROM join_it.tasks WHERE task_staff_id = ? AND intern_id = ?',
            [task_staff_id, intern_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการมีส่วนร่วมของคุณ" });
        }
        
        res.json({ success: true, message: "ยกเลิกการมีส่วนร่วมเรียบร้อย" });
    } catch (err) {
        console.error("Leave Task Error:", err);
        res.status(500).json({ message: "ไม่สามารถยกเลิกงานได้" });
    }
});

module.exports = router;
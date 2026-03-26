const express = require('express');
const router = express.Router();
const db = require('../mysql'); 
const joinPool = require('../helper/db');

const auth = require('../middleware/auth');
const taskContributionController = require('../controllers/taskContributionController');
// --// --- 1. GET /api/tasks ฉบับแก้ไข Group By ---\

router.get('/tasks_collab',auth,taskContributionController.getTasks)

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
            // ปรับให้ตรงกับคอลัมน์ในรูป: contribution_detail
            sql += ` AND (contribution_detail LIKE ? OR created_by LIKE ?)`;
            const search = `%${q}%`;
            params.push(search, search);
        }

        // แก้ไขจุดนี้: ใช้ชื่อคอลัมน์ตรงๆ ไม่ต้องมี t.
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

// --- 2. POST /api/tasks/join (กดมีส่วนร่วม) ---
router.post('/join', auth, async (req, res) => {
    const { task_staff_id } = req.body; // นี่คือค่า ID จากระบบ task_staff_id
    const intern_id = req.user.id;

    if (!task_staff_id) {
        return res.status(400).json({ message: "กรุณาระบุ task_staff_id" });
    }

    try {
        // ดึงชื่อเต็มของเด็กฝึกงานจากตาราง users มาบันทึกใน created_by
        const [userRows] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        if (userRows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        
        const creatorName = userRows[0].full_name;

        // บันทึกข้อมูลลงตาราง tasks (ตามโครงสร้างในรูป phpMyAdmin)
        const sql = `
            INSERT INTO join_it.tasks 
            (task_staff_id, intern_id, created_by, created_at)
            VALUES (?, ?, ?, NOW())
        `;

        await joinPool.query(sql, [task_staff_id, intern_id, creatorName]);
        res.status(201).json({ success: true, message: 'เข้าร่วมงานเรียบร้อย' });

    } catch (err) {
        console.error("Join Task Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
    }
});

// --- 3. PUT /api/tasks/leave/:id (ยกเลิกการมีส่วนร่วม) ---
router.delete('/leave/:id', auth, async (req, res) => {
    const task_staff_id = req.params.id;
    const intern_id = req.user.id;

    try {
        // เนื่องจากโครงสร้างปัจจุบันไม่มี deleted_at ในรูป จึงใช้การ DELETE แถวนั้นออกไปเลย
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
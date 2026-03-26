const joinPool = require('../helper/db');

// --- GET /api/tasks (ดึงงานพร้อมรายชื่อเด็กฝึกงาน) ---
exports.getTasks = async (req, res) => {
    const { date, q } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0]; // Default วันนี้
    const userId = req.user.id;

    try {
        // Query Join ข้อมูลจาก 2 Database (สมมติว่าใช้ Connection เดียวกันที่เข้าถึงได้ทั้งคู่)
        let sql = `
            SELECT 
                t.*, 
                GROUP_CONCAT(tc.created_by) as intern_names,
                MAX(CASE WHEN tc.intern_id = ? AND tc.deleted_at IS NULL THEN 1 ELSE 0 END) as isContributedByMe
            FROM orderit.data_report t
            LEFT JOIN join_it.tasks tc ON t.id = tc.task_staff_id AND tc.deleted_at IS NULL
            WHERE t.date_report = ?
        `;
        
        const params = [userId, targetDate];

        if (q) {
            sql += ` AND (t.report LIKE ? OR t.deviceName LIKE ? OR t.username LIKE ?)`;
            const search = `%${q}%`;
            params.push(search, search, search);
        }

        sql += ` GROUP BY t.id ORDER BY t.time_report DESC`;

        const [tasks] = await joinPool.query(sql, params);
        
        // Format ข้อมูลก่อนส่งกลับ
        const formattedTasks = tasks.map(task => ({
            ...task,
            interns: task.intern_names ? task.intern_names.split(',') : [],
            isContributedByMe: !!task.isContributedByMe
        }));

        res.json({ success: true, tasks: formattedTasks });
    } catch (err) {
        console.error("Get Tasks Error:", err);
        res.status(500).json({ success: false, message: "โหลดข้อมูลงานล้มเหลว" });
    }
};

// --- POST /api/intern-tasks (กดมีส่วนร่วม) ---
exports.joinTask = async (req, res) => {
    const { task_staff_id } = req.body;
    const intern_id = req.user.id;

    try {
        // 1. เช็กว่างานมีอยู่จริงไหม
        const [taskExists] = await joinPool.query('SELECT id FROM orderit.data_report WHERE id = ?', [task_staff_id]);
        if (taskExists.length === 0) return res.status(404).json({ message: "ไม่พบงานนี้ในระบบ" });

        // 2. ดึงชื่อผู้ใช้
        const [user] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        const creatorName = user[0].full_name;

        // 3. บันทึก (ใช้ ON DUPLICATE KEY เพื่อจัดการกรณีเคยลบแล้วจะกลับมาเพิ่มใหม่)
        const sql = `
            INSERT INTO join_it.tasks (task_staff_id, intern_id, created_by, created_at, deleted_at)
            VALUES (?, ?, ?, NOW(), NULL)
            ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()
        `;

        await joinPool.query(sql, [task_staff_id, intern_id, creatorName]);
        res.status(201).json({ success: true, message: "บันทึกการมีส่วนร่วมสำเร็จ" });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: "คุณมีส่วนร่วมในงานนี้อยู่แล้ว" });
        console.error("Join Task Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก" });
    }
};

// --- PUT /api/intern-tasks/:id (Soft Delete - ยกเลิกการมีส่วนร่วม) ---
exports.leaveTask = async (req, res) => {
    const { id } = req.params; // คือ task_staff_id
    const intern_id = req.user.id;

    try {
        const [result] = await joinPool.query(
            'UPDATE join_it.tasks SET deleted_at = NOW() WHERE task_staff_id = ? AND intern_id = ?',
            [id, intern_id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "ไม่พบข้อมูลการมีส่วนร่วม" });
        
        res.json({ success: true, message: "ยกเลิกการมีส่วนร่วมเรียบร้อย" });
    } catch (err) {
        console.error("Leave Task Error:", err);
        res.status(500).json({ message: "ล้มเหลวในการยกเลิก" });
    }
};
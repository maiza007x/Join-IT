const joinPool = require('../helper/db');

// --- 1. GET /api/tasks (ดึงงานพร้อมรายชื่อเด็กฝึกงาน - หน้าหลัก) ---
exports.getTasks = async (req, res) => {
    const { date, q } = req.query;
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const targetDate = date || today; 
    const userId = req.user.id;

    try {
        let sql = `
            SELECT 
                t.*, 
                GROUP_CONCAT(tc.created_by) as intern_names,
                MAX(CASE WHEN tc.intern_id = ? AND tc.deleted_at IS NULL THEN 1 ELSE 0 END) as isContributedByMe
            FROM orderit.data_report t
            LEFT JOIN join_it.tasks tc ON t.id = tc.task_staff_id AND tc.deleted_at IS NULL
            WHERE DATE(t.date_report) = ?
        `;
        
        const params = [userId, targetDate];

        if (q) {
            sql += ` AND (t.report LIKE ? OR t.deviceName LIKE ? OR t.username LIKE ?)`;
            const search = `%${q}%`;
            params.push(search, search, search);
        }

        sql += ` GROUP BY t.id ORDER BY t.time_report DESC`;

        const [tasks] = await joinPool.query(sql, params);
        
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

// --- 2. POST /api/intern-tasks (กดมีส่วนร่วม) ---
exports.joinTask = async (req, res) => {
    const { task_staff_id } = req.body;
    const intern_id = req.user.id;

    try {
        const [user] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        if (user.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        const creatorName = user[0].full_name;

        const sql = `
            INSERT INTO join_it.tasks (task_staff_id, intern_id, created_by, created_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()
        `;

        await joinPool.query(sql, [task_staff_id, intern_id, creatorName]);
        res.status(201).json({ success: true, message: "บันทึกการมีส่วนร่วมสำเร็จ" });
    } catch (err) {
        console.error("Join Task Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก" });
    }
};

// --- 3. DELETE /api/intern-tasks/:id (ยกเลิกการมีส่วนร่วม) ---
exports.leaveTask = async (req, res) => {
    const { id } = req.params; 
    const intern_id = req.user.id;

    try {
        const [result] = await joinPool.query(
            'UPDATE join_it.tasks SET deleted_at = NOW() WHERE task_staff_id = ? AND intern_id = ?',
            [id, intern_id]
        );
        res.json({ success: true, message: "ยกเลิกสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "ล้มเหลวในการยกเลิก" });
    }
};

// --- 4. GET /api/tasks/my-tasks (ดึงงานเฉพาะของฉัน - สำหรับหน้า MyTasks.jsx) ---
exports.getMyTasks = async (req, res) => {
    const intern_id = req.user.id;

    try {
        const sql = `
            SELECT 
                tc.id as contribution_id,
                tc.contribution_detail,
                tc.learning_outcome,
                tc.mentor_feedback,
                t.date_report,
                t.deviceName,
                t.report
            FROM join_it.tasks tc
            INNER JOIN orderit.data_report t ON tc.task_staff_id = t.id
            WHERE tc.intern_id = ? AND tc.deleted_at IS NULL
            ORDER BY t.date_report DESC, t.time_report DESC
        `;

        const [tasks] = await joinPool.query(sql, [intern_id]);
        res.json({ success: true, tasks });
    } catch (err) {
        console.error("Get My Tasks Error:", err);
        res.status(500).json({ success: false, message: "โหลดข้อมูลงานล้มเหลว" });
    }
};

// --- 5. PUT /api/tasks/contribution/:id (บันทึกรายละเอียดงาน 3 ฟิลด์ใหม่) ---
exports.updateContribution = async (req, res) => {
    const { id } = req.params; // คือ contribution_id
    const { contribution_detail, learning_outcome, mentor_feedback } = req.body;
    const intern_id = req.user.id;

    try {
        const [result] = await joinPool.query(
            `UPDATE join_it.tasks 
             SET contribution_detail = ?, 
                 learning_outcome = ?, 
                 mentor_feedback = ?,
                 updated_at = NOW()
             WHERE id = ? AND intern_id = ?`,
            [contribution_detail, learning_outcome, mentor_feedback, id, intern_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลหรือไม่มีสิทธิ์แก้ไข" });
        }

        res.json({ success: true, message: "บันทึกเรียบร้อย" });
    } catch (err) {
        console.error("Update Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
const joinPool = require('../helper/db');

// --- GET /api/tasks (ดึงงานพร้อมรายชื่อเด็กฝึกงาน) ---
exports.getTasks = async (req, res) => {
   const { date, q } = req.query;

// ถ้าไม่มีการส่ง date มาจากหน้าเว็บ ให้ใช้ CURDATE() (วันที่ปัจจุบันของ DB)
let sql = `
    SELECT t.*, r.deviceName, r.report, r.department, r.time_report
    FROM orderit.data_report r
    LEFT JOIN join_it.tasks t ON r.id = t.task_staff_id
    WHERE 1=1
`;

if (date) {
    sql += ` AND DATE(r.date_report) = ? `;
} else {
    // กรณีโหลดครั้งแรก ให้เอาวันที่ปัจจุบัน
    sql += ` AND DATE(r.date_report) = CURDATE() `;
}
    
    // แก้ไขจุดนี้: ใช้ locale 'sv-SE' เพื่อให้ได้ YYYY-MM-DD และล็อค Timezone เป็นเอเชีย/กรุงเทพ
    // เพื่อป้องกันปัญหา Server เป็นเวลา UTC (ช้ากว่าไทย 7 ชม.) แล้วดึงงานของ "เมื่อวาน" มาแทน
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
        
        // หมายเหตุ: ผมใส่ DATE(t.date_report) เพื่อให้ SQL ตัดเวลาออก เปรียบเทียบเฉพาะวันที่
        
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

// --- POST /api/intern-tasks (กดมีส่วนร่วม) ---
exports.joinTask = async (req, res) => {
    const { task_staff_id } = req.body;
    const intern_id = req.user.id;

    try {
        const [taskExists] = await joinPool.query('SELECT id FROM orderit.data_report WHERE id = ?', [task_staff_id]);
        if (taskExists.length === 0) return res.status(404).json({ message: "ไม่พบงานนี้ในระบบ" });

        const [user] = await joinPool.query('SELECT full_name FROM join_it.users WHERE id = ?', [intern_id]);
        
        // ป้องกัน Error กรณีหา User ไม่เจอ
        if (user.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        const creatorName = user[0].full_name;

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

// ส่วนของ exports.leaveTask คงเดิมไว้ได้เลยครับ เพราะใช้ SQL UPDATE ปกติ
exports.leaveTask = async (req, res) => {
    const { id } = req.params; 
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
        // เพิ่มบรรทัดนี้ก่อนบรรทัด [tasks] = await joinPool.query...
console.log("SQL Params:", params);
    }
};
const joinPool = require('../helper/db');

// --- 1. ดึงงานหน้าหลัก - Tasks.jsx ---
exports.getTasksCollab = async (req, res) => {
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
            FROM orderit1.data_report r
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
};

// --- 2. ดึงงานของฉัน - MyTasks.jsx ---
exports.getMyTasks = async (req, res) => {
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
            LEFT JOIN orderit1.data_report r ON t.task_staff_id = r.id
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
};

// --- 3. อัปเดตข้อมูลรายละเอียดงาน ---
exports.updateContribution = async (req, res) => {
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
};

// --- 4. กดเข้าร่วมงาน ---
exports.joinTask = async (req, res) => {
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
};

// --- 5. ยกเลิกการเข้าร่วม - Soft Delete ---
exports.leaveTask = async (req, res) => {
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
};

// --- 6. ดึงข้อมูลสถิติสำหรับ Analytics Dashboard ---
exports.getAnalyticsStats = async (req, res) => {
    try {
        const { range, type } = req.query; // range: today, week, month, year | type: person, hour, rating, sla, category

        // Helper สำหรับสร้าง SQL WHERE clause ตามช่วงเวลา
        const getDateFilter = (r) => {
            switch (r) {
                case 'week': return 'YEARWEEK(r.date_report, 1) = YEARWEEK(CURDATE(), 1)';
                case 'month': return 'MONTH(r.date_report) = MONTH(CURDATE()) AND YEAR(r.date_report) = YEAR(CURDATE())';
                case 'year': return 'YEAR(r.date_report) = YEAR(CURDATE())';
                case 'today':
                default: return 'DATE(r.date_report) = CURDATE()';
            }
        };

        const dateFilter = getDateFilter(range);

        // ฟังก์ชันย่อยสำหรับดึงแต่ละส่วน (รองรับการดึงเฉพาะส่วนเพื่อ Performance)
        const fetchPersonStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT username as name, COUNT(*) as count 
                FROM orderit1.data_report r
                WHERE ${dateFilter} 
                GROUP BY username
            `);
            return rows;
        };

        const fetchHourStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT HOUR(r.time_report) as hour, COUNT(*) as count 
                FROM orderit1.data_report r
                WHERE ${dateFilter} 
                GROUP BY HOUR(r.time_report) 
                ORDER BY hour
            `);
            return rows;
        };

        const fetchRatingStats = async () => {
            // หมายเหตุ: ตาราง rating เป็น global หรืออาจต้องมีระบบกรองวันทีตาม timestamp
            const [rows] = await joinPool.query(`
                SELECT 
                    AVG(service_speed) as speed, 
                    AVG(problem_satisfaction) as problem, 
                    AVG(service_satisfaction) as service 
                FROM orderit1.rating
                WHERE ${dateFilter.replace('r.date_report', 'DATE(timestamp)')}
            `);
            return rows[0] || { speed: 0, problem: 0, service: 0 };
        };

        const fetchSLAStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT 
                    SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, r.time_report, r.close_date) <= 30 THEN 1 ELSE 0 END) as within_sla,
                    SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, r.time_report, r.close_date) > 30 THEN 1 ELSE 0 END) as over_sla
                FROM orderit1.data_report r
                WHERE ${dateFilter} AND r.close_date IS NOT NULL
            `);
            return rows[0] || { within_sla: 0, over_sla: 0 };
        };

        const fetchCategoryStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT r.problem as category, COUNT(*) as count 
                FROM orderit1.data_report r
                WHERE ${dateFilter} AND r.problem IS NOT NULL 
                GROUP BY r.problem
            `);
            return rows;
        };

        // logic: ถ้าส่ง type มา จะคืนผลแค่ส่วนนั้น (เพื่ออัปเดตกราฟเดียว)
        // ถ้าไม่ส่ง จะคืนทั้งหมด (โหลดครั้งแรก)
        let responseData = {};
        if (type) {
            switch (type) {
                case 'person': responseData.personStats = await fetchPersonStats(); break;
                case 'hour': responseData.hourStats = await fetchHourStats(); break;
                case 'rating': responseData.ratingStats = await fetchRatingStats(); break;
                case 'sla': responseData.slaStats = await fetchSLAStats(); break;
                case 'category': responseData.categoryStats = await fetchCategoryStats(); break;
            }
        } else {
            responseData = {
                personStats: await fetchPersonStats(),
                hourStats: await fetchHourStats(),
                ratingStats: await fetchRatingStats(),
                slaStats: await fetchSLAStats(),
                categoryStats: await fetchCategoryStats()
            };
        }

        res.json({ success: true, data: responseData });
    } catch (err) {
        console.error("❌ Analytics Stats Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลสถิติล้มเหลว" });
    }
};

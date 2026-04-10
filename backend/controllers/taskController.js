const joinPool = require('../helper/db');

// --- 1. ดึงงานหน้าหลัก - Tasks.jsx ---
exports.getTasksCollab = async (req, res) => {
    const { date, q } = req.query;

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const targetDate = date || today;
    const userId = req.user.id;

    try {
        // ดึงงานหลัก (Staff Tasks)
        let staffSql = `
            SELECT 
                r.id as id, r.deviceName, r.report, r.time_report, r.date_report, r.username,
                GROUP_CONCAT(DISTINCT u.full_name SEPARATOR '||') as intern_names,
                MAX(CASE WHEN t.intern_id = ? AND t.deleted_at IS NULL THEN 1 ELSE 0 END) as isContributedByMe
            FROM orderit.data_report r
            LEFT JOIN join_it.tasks t ON r.id = t.task_staff_id AND t.deleted_at IS NULL
            LEFT JOIN join_it.users u ON t.intern_id = u.id
            WHERE DATE(r.date_report) = ?
        `;
        const staffParams = [userId, targetDate];
        if (q) {
            staffSql += ` AND (r.report LIKE ? OR r.deviceName LIKE ?)`;
            const search = `%${q}%`;
            staffParams.push(search, search);
        }
        staffSql += ` GROUP BY r.id ORDER BY r.id DESC`;
        const [staffRows] = await joinPool.query(staffSql, staffParams);

        // ดึงงานนักศึกษา (Intern Tasks)
        let internSql = `
            SELECT 
                i.*, 
                d.depart_name as department_name,
                u.full_name as taker_name
            FROM join_it.intern_tasks i
            LEFT JOIN orderit.depart d ON i.department = d.depart_id
            LEFT JOIN join_it.users u ON i.username = u.username
            WHERE DATE(i.date_report) = ?
        `;
        const internParams = [targetDate];
        if (q) {
            internSql += ` AND (i.report LIKE ? OR i.deviceName LIKE ?)`;
            const search = `%${q}%`;
            internParams.push(search, search);
        }
        internSql += ` ORDER BY i.id DESC`;
        const [internRows] = await joinPool.query(internSql, internParams);

        const formattedStaffTasks = staffRows.map(task => ({
            ...task,
            interns: task.intern_names ? task.intern_names.split('||') : [],
            isContributedByMe: !!task.isContributedByMe
        }));

        res.json({ 
            success: true, 
            tasks: formattedStaffTasks,
            internTasks: internRows
        });
    } catch (err) {
        console.error("❌ Tasks Collab Error:", err.message);
        res.status(500).json({ success: false, message: "โหลดข้อมูลงานล้มเหลว" });
    }
};

// --- 2. ดึงงานของฉัน - MyTasks.jsx ---
exports.getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const username = req.user.username;
        const { date, q } = req.query;

        // ดึงงานหลัก (Staff Tasks) ที่เราเข้าร่วม
        let staffSql = `
            SELECT 
                t.id as contribution_id, 
                t.task_staff_id,
                t.contribution_detail,
                t.learning_outcome,
                t.mentor_feedback,
                DATE_FORMAT(r.date_report, '%Y-%m-%d') as date_report,
                r.time_report,
                r.deviceName, 
                r.report,
                'staff' as type
            FROM join_it.tasks t
            LEFT JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE t.intern_id = ? AND t.deleted_at IS NULL
        `;
        const staffParams = [userId];
        if (date) { staffSql += ` AND DATE(r.date_report) = ?`; staffParams.push(date); }
        if (q) { staffSql += ` AND (r.report LIKE ? OR r.deviceName LIKE ?)`; const search = `%${q}%`; staffParams.push(search, search); }
        staffSql += ` ORDER BY t.created_at DESC`;
        const [staffRows] = await joinPool.query(staffSql, staffParams);

        // ดึงงานนักศึกษา (Intern Tasks) ที่เรารับผิดชอบ
        let internSql = `
            SELECT 
                i.id as intern_task_id,
                i.id,
                i.deviceName,
                i.report,
                DATE_FORMAT(i.date_report, '%Y-%m-%d') as date_report,
                i.time_report,
                i.contribution_detail,
                i.learning_outcome,
                i.status,
                'intern' as type
            FROM join_it.intern_tasks i
            WHERE i.username = ?
        `;
        const internParams = [username];
        if (date) { internSql += ` AND DATE(i.date_report) = ?`; internParams.push(date); }
        if (q) { internSql += ` AND (i.report LIKE ? OR i.deviceName LIKE ?)`; const search = `%${q}%`; internParams.push(search, search); }
        internSql += ` ORDER BY i.id DESC`;
        const [internRows] = await joinPool.query(internSql, internParams);

        res.json({ 
            success: true, 
            tasks: staffRows,
            internTasks: internRows
        });
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
                FROM orderit.data_report r
                WHERE ${dateFilter} 
                GROUP BY username
            `);
            return rows;
        };

        const fetchHourStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT HOUR(r.time_report) as hour, COUNT(*) as count 
                FROM orderit.data_report r
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
                FROM orderit.rating
                WHERE ${dateFilter.replace('r.date_report', 'DATE(timestamp)')}
            `);
            return rows[0] || { speed: 0, problem: 0, service: 0 };
        };

        const fetchSLAStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT 
                    SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, r.time_report, r.close_date) <= 30 THEN 1 ELSE 0 END) as within_sla,
                    SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, r.time_report, r.close_date) > 30 THEN 1 ELSE 0 END) as over_sla
                FROM orderit.data_report r
                WHERE ${dateFilter} AND r.close_date IS NOT NULL
            `);
            return rows[0] || { within_sla: 0, over_sla: 0 };
        };

        const fetchCategoryStats = async () => {
            const [rows] = await joinPool.query(`
                SELECT r.problem as category, COUNT(*) as count 
                FROM orderit.data_report r
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

// --- 7. ดึงข้อมูลสำหรับตัวเลือกในฟอร์ม (แผนก และ อุปกรณ์) ---
exports.getFormOptions = async (req, res) => {
    try {
        const [departs] = await joinPool.query('SELECT depart_id as value, depart_name as label FROM orderit.depart ORDER BY depart_name ASC');
        const [devices] = await joinPool.query('SELECT device_id as value, device_name as label FROM orderit.device ORDER BY device_name ASC');

        res.json({
            success: true,
            departs,
            devices
        });
    } catch (err) {
        console.error("❌ Form Options Error:", err.message);
        res.status(500).json({ success: false, message: "โหลดข้อมูลตัวเลือกฟอร์มล้มเหลว" });
    }
};

// --- 8. สร้างงานใหม่ลงใน intern_task ---
exports.createInternTask = async (req, res) => {
    const {
        date_report,
        time_report,
        reporter,
        department,
        tel,
        deviceName,
        number_device,
        ip_address,
        report,
        work_type,
        priority
    } = req.body;

    const userId = req.user.id;
    const username = req.user.username;
    const fullName = req.user.full_name;

    try {
        // ใช้ joinPool เพื่อบันทึกลง join_it.intern_task
        // Mapping ฟิลด์ตาม Schema ที่ผู้ใช้แจ้งมา
        const sql = `
            INSERT INTO join_it.intern_tasks (
                date_report, time_report, reporter, department, 
                tel, deviceName, number_device, ip_address, 
                report, status, username, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, NOW())
        `;

        // หมายเหตุ: work_type และ priority หากยังไม่มีฟิลด์ในตาราง 
        // จะนำไปต่อท้ายใน report เพื่อไม่ให้ข้อมูลสูญหาย (หรือถ้าผู้ใช้เพิ่มฟิลด์แล้วค่อยมาแก้ SQL)
        const combinedReport = `[${work_type || 'ทั่วไป'}] [ความเร่งด่วน: ${priority || 'ปกติ'}] ${report}`;

        const params = [
            date_report,
            time_report,
            reporter,
            department,
            tel,
            deviceName,
            number_device,
            ip_address,
            combinedReport,
            fullName
        ];

        await joinPool.query(sql, params);

        res.status(201).json({ success: true, message: "สร้างงานใหม่สำเร็จ" });
    } catch (err) {
        console.error("❌ Create Intern Task Error:", err.message);
        res.status(500).json({ success: false, message: "บันทึกข้อมูลล้มเหลว" });
    }
};
// --- 9. กดรับงาน (Intern Task) ---
exports.acceptInternTask = async (req, res) => {
    const taskId = req.params.id;
    const username = req.user.username;
    try {
        const [result] = await joinPool.query(
            'UPDATE join_it.intern_tasks SET username = ?, status = 2 WHERE id = ? AND username IS NULL',
            [username, taskId]
        );
        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "งานนี้มีคนรับไปแล้ว หรือไม่พบงาน" });
        }
        res.json({ success: true, message: "รับงานเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ success: false, message: "ล้มเหลว" });
    }
};

// --- 10. ยกเลิกการรับงาน (Intern Task) ---
exports.leaveInternTask = async (req, res) => {
    const taskId = req.params.id;
    const username = req.user.username;
    try {
        const [result] = await joinPool.query(
            'UPDATE join_it.intern_tasks SET username = NULL, status = 1 WHERE id = ? AND username = ?',
            [taskId, username]
        );
        res.json({ success: true, message: "ยกเลิกการรับงานเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ success: false, message: "ล้มเหลว" });
    }
};
// --- 11. อัปเดตรายละเอียดงานนักศึกษา (Intern Task) ---
exports.updateInternTaskDetails = async (req, res) => {
    const taskId = req.params.id;
    const { contribution_detail, learning_outcome } = req.body;
    const username = req.user.username;

    try {
        await joinPool.query(
            `UPDATE join_it.intern_tasks 
             SET contribution_detail = ?, 
                 learning_outcome = ?,
                 updated_at = NOW() 
             WHERE id = ? AND username = ?`,
            [contribution_detail, learning_outcome, taskId, username]
        );
        res.json({ success: true, message: "บันทึกสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: "บันทึกล้มเหลว" });
    }
};

// --- 12. ปิดงานนักศึกษา (Close Intern Task) ---
exports.closeInternTask = async (req, res) => {
    const taskId = req.params.id;
    const { contribution_detail, learning_outcome } = req.body;
    const username = req.user.username;

    try {
        await joinPool.query(
            `UPDATE join_it.intern_tasks 
             SET contribution_detail = ?, 
                 learning_outcome = ?,
                 status = 3,
                 closed_date = CURDATE(),
                 closed_time = CURTIME(),
                 updated_at = NOW() 
             WHERE id = ? AND username = ?`,
            [contribution_detail, learning_outcome, taskId, username]
        );
        res.json({ success: true, message: "ปิดงานเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(500).json({ success: false, message: "ปิดงานล้มเหลว" });
    }
};

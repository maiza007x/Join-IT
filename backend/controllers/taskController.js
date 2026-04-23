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
                d.depart_name as department_name,
                GROUP_CONCAT(DISTINCT u.full_name SEPARATOR '||') as intern_names,
                MAX(CASE WHEN t.intern_id = ? AND t.deleted_at IS NULL THEN 1 ELSE 0 END) as isContributedByMe
            FROM orderit.data_report r
            LEFT JOIN orderit.depart d ON r.department = d.depart_id
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
                d.depart_name as department_name,
                'staff' as type
            FROM join_it.tasks t
            LEFT JOIN orderit.data_report r ON t.task_staff_id = r.id
            LEFT JOIN orderit.depart d ON r.department = d.depart_id
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
                d.depart_name as department_name,
                'intern' as type
            FROM join_it.intern_tasks i
            LEFT JOIN orderit.depart d ON i.department = d.depart_id
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
        const { range, year, term, university, person } = req.query;

        // 1. สร้าง Filter สำหรับช่วงเวลา (Time Range)
        const getDateFilter = (r) => {
            switch (r) {
                case 'week': return 'YEARWEEK(r.date_report, 1) = YEARWEEK(CURDATE(), 1)';
                case 'month': return 'MONTH(r.date_report) = MONTH(CURDATE()) AND YEAR(r.date_report) = YEAR(CURDATE())';
                case 'year': return 'YEAR(r.date_report) = YEAR(CURDATE())';
                case 'today': return 'DATE(r.date_report) = CURDATE()';
                case 'all': return '1=1';
                default: return 'DATE(r.date_report) = CURDATE()';
            }
        };
        const dateFilter = getDateFilter(range);

        // 2. สร้าง Filter สำหรับ Global Filters (Year, Term, University, Person)
        // สำหรับ Join Tasks และ Top Skill (ใช้ join_it.users และ join_it.tasks)
        let globalJoinFilter = '1=1';
        const globalJoinParams = [];

        if (year && year !== 'all') { globalJoinFilter += ' AND u.academic_year = ?'; globalJoinParams.push(year); }
        if (term && term !== 'all') { globalJoinFilter += ' AND u.term = ?'; globalJoinParams.push(term); }
        if (university && university !== 'all') { globalJoinFilter += ' AND u.university_name = ?'; globalJoinParams.push(university); }
        if (person && person !== 'all') { globalJoinFilter += ' AND u.id = ?'; globalJoinParams.push(person); }

        // --- 📊 คำนวณ KPI Data ---

        // A. ภารกิจทั้งหมด (Total Tasks ในช่วงเวลาที่เลือก) จาก orderit.data_report
        const [totalRows] = await joinPool.query(`
            SELECT COUNT(*) as total 
            FROM orderit.data_report r 
            WHERE ${dateFilter}
        `);

        // B. จำนวนงานที่เข้าร่วม (Join Tasks) กรองตามช่วงเวลา + Global Filter
        const [joinRows] = await joinPool.query(`
            SELECT COUNT(DISTINCT t.task_staff_id) as total
            FROM join_it.tasks t
            INNER JOIN join_it.users u ON t.intern_id = u.id
            INNER JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE ${dateFilter} AND t.deleted_at IS NULL AND ${globalJoinFilter}
        `, globalJoinParams);

        // C. ทักษะหลัก (Top Skill) - หา Keyword ที่ซ้ำกันมากที่สุดจาก Description
        const [categoryRows] = await joinPool.query(`
    SELECT r.problem, COUNT(*) as count
    FROM join_it.tasks t
    INNER JOIN join_it.users u ON t.intern_id = u.id
    INNER JOIN orderit.data_report r ON t.task_staff_id = r.id
    WHERE ${dateFilter} AND t.deleted_at IS NULL AND ${globalJoinFilter}
    GROUP BY r.problem
    ORDER BY count DESC
    LIMIT 1
`, globalJoinParams);

        let topSkill = categoryRows.length > 0 ? categoryRows[0].problem : '-';

        // ตัดเลขนำหน้าออกให้ดูสวยงาม (ถ้าต้องการ)
        if (topSkill !== '-') {
            topSkill = topSkill.replace(/^\d{2}\./, '').trim();
        }

        res.json({
            success: true,
            kpi: {
                totalTasks: totalRows[0]?.total || 0,
                joinTasks: joinRows[0]?.total || 0,
                topSkill: topSkill
            }
        });
    } catch (err) {
        console.error("❌ Analytics Stats Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลสถิติล้มเหลว" });
    }
};

// --- 6.1 ดึงข้อมูลสำหรับกราฟ Workload (Gantt & Bar) ---
exports.getWorkloadChartData = async (req, res) => {
    try {
        const {
            studentMode, // 'all', 'individual'
            studentId,
            academicYear,
            term,
            university,
            startDate,
            endDate,
            groupingCategory, // 'workingList', 'problemList', 'device', 'depart', 'staff'
            // Specific filters
            workingList,
            problemList,
            device,
            depart,
            staff,
            view,
            timeRange
        } = req.query;

        // Map groupingCategory to column name
        const categoryMap = {
            workingList: 'r.device',
            problemList: 'r.problem',
            device: 'r.deviceName',
            depart: 'd.depart_name',
            staff: 'r.username'
        };

        const groupColumn = categoryMap[groupingCategory] || 'r.work_type';

        let sql = `
            SELECT 
                u.full_name as student_name,
                r.date_report,
                r.time_report,
                r.close_date as end_time,
                r.report as title,
                r.id as task_id,
                ${groupColumn} as category_val,
                DAYNAME(r.date_report) as day_en,
                CONCAT(
                    CASE DAYNAME(r.date_report)
                        WHEN 'Monday' THEN 'จันทร์'
                        WHEN 'Tuesday' THEN 'อังคาร'
                        WHEN 'Wednesday' THEN 'พุธ'
                        WHEN 'Thursday' THEN 'พฤหัสบดี'
                        WHEN 'Friday' THEN 'ศุกร์'
                        WHEN 'Saturday' THEN 'เสาร์'
                        WHEN 'Sunday' THEN 'อาทิตย์'
                    END,
                    ' (', DAY(r.date_report), ')'
                ) as day_th_with_date
            FROM join_it.tasks t
            JOIN join_it.users u ON t.intern_id = u.id
            JOIN orderit.data_report r ON t.task_staff_id = r.id
            JOIN orderit.depart d ON r.department = d.depart_id
            WHERE t.deleted_at IS NULL
        `;

        const params = [];

        // Global Filters
        if (academicYear && academicYear !== 'all') { sql += ` AND u.academic_year = ?`; params.push(academicYear); }
        if (term && term !== 'all') { sql += ` AND u.term = ?`; params.push(term); }
        if (university && university !== 'all') { sql += ` AND u.university_name = ?`; params.push(university); }

        // Date Range
        if (startDate && endDate) {
            sql += ` AND r.date_report BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        // Student Mode
        if (studentMode === 'individual' && studentId && studentId !== 'all') {
            sql += ` AND u.id = ?`;
            params.push(studentId);
        }

        // Local Filters (Legends)
        if (workingList && workingList !== 'all') { sql += ` AND r.work_type = ?`; params.push(workingList); }
        if (problemList && problemList !== 'all') { sql += ` AND r.problem = ?`; params.push(problemList); }
        if (device && device !== 'all') { sql += ` AND r.device = ?`; params.push(device); }
        if (depart && depart !== 'all') { sql += ` AND r.department = ?`; params.push(depart); }
        if (staff && staff !== 'all') { sql += ` AND r.username = ?`; params.push(staff); }

        sql += ` ORDER BY r.date_report ASC, r.time_report ASC`;

        // console.log("🔍 Workload SQL:", sql);
        // console.log("📦 Params:", params);

        const [rows] = await joinPool.query(sql, params);
        // console.log("✅ Query Result Count:", rows.length);

        // Transform data for Gantt
        const ganttData = rows.map(row => {
            const startTimeStr = row.time_report.toString(); // HH:mm:ss
            const endTimeStr = row.end_time ? row.end_time.toString() : null;

            const getDecimalHour = (timeStr) => {
                if (!timeStr) return null;
                const [h, m] = timeStr.split(':').map(Number);
                return h + (m / 60);
            };

            const start = getDecimalHour(startTimeStr);
            let end = getDecimalHour(endTimeStr);

            // Default duration if no end time (e.g. 1 hour)
            if (!end || end <= start) {
                end = start + 1;
            }

            let yLabel = row.student_name;
            if (studentMode !== 'all') {
                if (view === 'bar') {
                    const d = new Date(row.date_report);
                    if (timeRange === 'today' || timeRange === 'custom') {
                        yLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                    } else if (timeRange === 'month') {
                        yLabel = String(d.getDate());
                    } else if (timeRange === 'week') {
                        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                        yLabel = `${row.day_th}(${d.getDate()} ${thaiMonths[d.getMonth()]})`;
                    } else {
                        yLabel = row.day_th_with_date;
                    }
                } else {
                    yLabel = row.day_th_with_date;
                }
            }

            return {
                id: row.task_id,
                yLabel: yLabel,
                title: row.title,
                start: start,
                duration: end - start,
                type: 'join',
                date: row.date_report,
                category: row.category_val
            };
        });

        // Prepare Bar Data (Stacked by category)
        let labels = [];
        if (view === 'bar' && studentMode !== 'all' && startDate && endDate) {
            const startD = new Date(startDate);
            const endD = new Date(endDate);

            if (timeRange === 'today' || timeRange === 'custom') {
                for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
                    labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
                }
            } else if (timeRange === 'week') {
                const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
                for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
                    labels.push(`${thaiDays[d.getDay()]}(${d.getDate()} ${thaiMonths[d.getMonth()]})`);
                }
            } else if (timeRange === 'month') {
                for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
                    labels.push(String(d.getDate()));
                }
            } else {
                labels = [...new Set(ganttData.map(item => item.yLabel))];
            }
        } else {
            // For All Students or when no dates, use data-driven labels but they will be sorted due to SQL ORDER BY
            labels = [...new Set(ganttData.map(item => item.yLabel))];
        }
        const categories = [...new Set(ganttData.map(item => item.category))];

        const datasets = categories.map((cat, idx) => {
            const colors = [
                'rgba(79, 70, 229, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)',
                'rgba(20, 184, 166, 0.8)', 'rgba(249, 115, 22, 0.8)'
            ];
            return {
                label: cat || 'ไม่ระบุ',
                data: labels.map(label => ganttData.filter(item => item.yLabel === label && item.category === cat).length),
                backgroundColor: colors[idx % colors.length],
                borderRadius: 4
            };
        });

        const barData = {
            labels: labels,
            datasets: datasets
        };

        res.json({ success: true, ganttData, barData });
    } catch (err) {
        console.error("❌ Workload Chart Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลกราฟล้มเหลว" });
    }
};

// --- 6.2 ดึงข้อมูลสำหรับ Local Filter ของ Workload ---
exports.getWorkloadFilters = async (req, res) => {
    try {
        const { academicYear, term, university } = req.query;

        const [workingList] = await joinPool.query('SELECT workingName as label, workingName as value FROM orderit.workinglist');
        const [problemList] = await joinPool.query('SELECT problemName as label, problemName as value FROM orderit.problemlist');
        const [device] = await joinPool.query('SELECT device_name as label, device_name as value FROM orderit.device');
        const [depart] = await joinPool.query('SELECT depart_name as label, depart_name as value FROM orderit.depart');
        const [staff] = await joinPool.query('SELECT username as value, CONCAT(fname, " ", lname) as label FROM orderit.admin');

        // Fetch Universities with User Counts filtered by year and term
        let uniSql = `
            SELECT university_name as label, university_name as value, COUNT(*) as user_count 
            FROM join_it.users 
            WHERE university_name IS NOT NULL AND university_name <> ""
        `;
        const uniParams = [];
        if (academicYear && academicYear !== 'all') { uniSql += ` AND academic_year = ?`; uniParams.push(academicYear); }
        if (term && term !== 'all') { uniSql += ` AND term = ?`; uniParams.push(term); }
        uniSql += ` GROUP BY university_name ORDER BY user_count DESC`;
        const [universities] = await joinPool.query(uniSql, uniParams);

        // Fetch Students filtered by year, term, and university
        let studentSql = `
            SELECT full_name as label, id as value 
            FROM join_it.users 
            WHERE 1=1
        `;
        const studentParams = [];
        if (academicYear && academicYear !== 'all') { studentSql += ` AND academic_year = ?`; studentParams.push(academicYear); }
        if (term && term !== 'all') { studentSql += ` AND term = ?`; studentParams.push(term); }
        if (university && university !== 'all') { studentSql += ` AND university_name = ?`; studentParams.push(university); }
        studentSql += ` ORDER BY full_name ASC`;
        const [students] = await joinPool.query(studentSql, studentParams);

        res.json({
            success: true,
            filters: {
                workingList,
                problemList,
                device,
                depart,
                staff,
                universities,
                students
            }
        });
    } catch (err) {
        console.error("❌ Workload Filters Error:", err.message);
        res.status(500).json({ success: false, message: "โหลดข้อมูลฟิลเตอร์ล้มเหลว" });
    }
};

// --- 6.3 ดึงข้อมูลสำหรับกราฟสัดส่วนงาน (Donut Chart) ---
exports.getWorkTypeData = async (req, res) => {
    try {
        const {
            studentMode,
            studentId,
            academicYear,
            term,
            university,
            startDate,
            endDate,
            category // 'workingList', 'problemList', 'device', 'depart', 'staff'
        } = req.query;

        // Map category to column name (Keep consistent with getWorkloadChartData)
        const categoryMap = {
            workingList: 'r.device',
            problemList: 'r.problem',
            device: 'r.deviceName',
            depart: 'd.depart_name',
            staff: 'r.username'
        };

        const groupColumn = categoryMap[category] || 'r.work_type';

        let sql = `
            SELECT 
                ${groupColumn} as label,
                COUNT(*) as count
            FROM join_it.tasks t
            JOIN join_it.users u ON t.intern_id = u.id
            JOIN orderit.data_report r ON t.task_staff_id = r.id
            JOIN orderit.depart d ON r.department = d.depart_id
            WHERE t.deleted_at IS NULL
        `;

        const params = [];

        // Global Filters
        if (academicYear && academicYear !== 'all') { sql += ` AND u.academic_year = ?`; params.push(academicYear); }
        if (term && term !== 'all') { sql += ` AND u.term = ?`; params.push(term); }
        if (university && university !== 'all') { sql += ` AND u.university_name = ?`; params.push(university); }

        // Date Range
        if (startDate && endDate) {
            sql += ` AND r.date_report BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        // Student Mode
        if (studentMode === 'individual' && studentId && studentId !== 'all') {
            sql += ` AND u.id = ?`;
            params.push(studentId);
        }

        sql += ` GROUP BY ${groupColumn}`;

        const [rows] = await joinPool.query(sql, params);

        const labels = rows.map(row => row.label || 'ไม่ระบุ');
        const counts = rows.map(row => row.count);

        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4b99', '#14b8a6', '#f97316'
        ];

        res.json({
            success: true,
            chartData: {
                labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors.slice(0, labels.length),
                    hoverOffset: 4
                }]
            }
        });
    } catch (err) {
        console.error("❌ WorkType Chart Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลสัดส่วนงานล้มเหลว" });
    }
};

// --- 6.4 ดึงข้อมูลสำหรับกราฟ Heatmap ---
exports.getHeatmapData = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            category // 'workingList', 'problemList', 'device', 'depart', 'staff'
        } = req.query;

        const categoryMap = {
            workingList: 'r.device',
            problemList: 'r.problem',
            device: 'r.deviceName',
            depart: 'd.depart_name',
            staff: 'r.username'
        };

        const groupColumn = categoryMap[category] || 'r.device';

        // 1. Fetch Master Labels based on category
        let masterLabels = [];
        try {
            if (category === 'workingList') {
                const [rows] = await joinPool.query('SELECT workingName as label FROM orderit.workinglist ORDER BY workingName ASC');
                masterLabels = rows.map(r => r.label);
            } else if (category === 'problemList') {
                const [rows] = await joinPool.query('SELECT problemName as label FROM orderit.problemlist ORDER BY problemName ASC');
                masterLabels = rows.map(r => r.label);
            } else if (category === 'device') {
                const [rows] = await joinPool.query('SELECT device_name as label FROM orderit.device ORDER BY device_name ASC');
                masterLabels = rows.map(r => r.label);
            } else if (category === 'depart') {
                const [rows] = await joinPool.query('SELECT depart_name as label FROM orderit.depart ORDER BY depart_name ASC');
                masterLabels = rows.map(r => r.label);
            } else if (category === 'staff') {
                const [rows] = await joinPool.query('SELECT username as label FROM orderit.admin ORDER BY username ASC');
                masterLabels = rows.map(r => r.label);
            } else {
                // Fallback for work_type if not specified
                const [rows] = await joinPool.query('SELECT DISTINCT work_type as label FROM orderit.data_report WHERE work_type IS NOT NULL AND work_type <> "" ORDER BY work_type ASC');
                masterLabels = rows.map(r => r.label);
            }
        } catch (err) {
            console.error("Master labels fetch error:", err);
        }

        // Always include "ไม่ระบุ" at the end if there's unmatched data
        masterLabels.push("ไม่ระบุ");

        let sql = `
            SELECT 
                ${groupColumn} as category_val,
                HOUR(r.time_report) as hour_val,
                COUNT(*) as count
            FROM orderit.data_report r
            JOIN orderit.depart d ON r.department = d.depart_id
            WHERE 1=1
        `;

        const params = [];

        // Date Range
        if (startDate && endDate) {
            sql += ` AND r.date_report BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        sql += ` GROUP BY ${groupColumn}, HOUR(r.time_report)`;

        const [rows] = await joinPool.query(sql, params);

        // Prepare heatmap data structure
        const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

        // Initialize Matrix: masterLabels x hours (filled with 0)
        const matrix = masterLabels.map(() => hours.map(() => 0));

        // Fill Matrix
        rows.forEach(row => {
            const hourIdx = hours.findIndex(h => parseInt(h.split(':')[0]) === row.hour_val);
            if (hourIdx === -1) return;

            let labelIdx = masterLabels.indexOf(row.category_val);
            if (labelIdx === -1) {
                // Map to "ไม่ระบุ" which is the last element
                labelIdx = masterLabels.length - 1;
            }

            matrix[labelIdx][hourIdx] += row.count;
        });

        // Filter out labels that have 0 total count to keep the chart clean, 
        // EXCEPT if the user wants to see all master labels.
        // Let's keep only labels with data to avoid a huge empty chart.
        const finalLabels = [];
        const finalMatrix = [];

        masterLabels.forEach((label, idx) => {
            const total = matrix[idx].reduce((a, b) => a + b, 0);
            if (total > 0) {
                finalLabels.push(label);
                finalMatrix.push(matrix[idx]);
            }
        });

        res.json({
            success: true,
            heatmapData: {
                yLabels: finalLabels,
                hours,
                matrix: finalMatrix
            }
        });
    } catch (err) {
        console.error("❌ Heatmap Chart Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลกราฟความหนาแน่นล้มเหลว" });
    }
};

// --- 6.5 ดึงข้อมูลสำหรับกราฟการร่วมงาน (Collaboration) ---
exports.getCollaborationData = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            academicYear,
            term,
            university,
            studentMode,
            studentId
        } = req.query;

        let sql = `
            SELECT 
                r.username as staff_name,
                COUNT(*) as count
            FROM join_it.tasks t
            JOIN join_it.users u ON t.intern_id = u.id
            JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE t.deleted_at IS NULL
        `;

        const params = [];

        // Global Filters
        if (academicYear && academicYear !== 'all') { sql += ` AND u.academic_year = ?`; params.push(academicYear); }
        if (term && term !== 'all') { sql += ` AND u.term = ?`; params.push(term); }
        if (university && university !== 'all') { sql += ` AND u.university_name = ?`; params.push(university); }

        // Date Range
        if (startDate && endDate) {
            sql += ` AND r.date_report BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        // Student Mode
        if (studentMode === 'individual' && studentId && studentId !== 'all') {
            sql += ` AND u.id = ?`;
            params.push(studentId);
        }

        sql += ` GROUP BY r.username ORDER BY count DESC`;

        const [rows] = await joinPool.query(sql, params);

        const labels = rows.map(r => r.staff_name || 'ไม่ระบุ');
        const counts = rows.map(r => r.count);

        res.json({
            success: true,
            chartData: {
                labels,
                datasets: [{
                    label: 'จำนวนงานที่ร่วมกัน',
                    data: counts,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderRadius: 6
                }]
            }
        });
    } catch (err) {
        console.error("❌ Collab Chart Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลกราฟการร่วมงานล้มเหลว" });
    }
};

// --- 6.6 ดึงข้อมูลสำหรับกราฟคีย์เวิร์ดการเรียนรู้ (Learning Keywords) ---
exports.getLearningKeywordsData = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            academicYear,
            term,
            university,
            studentMode,
            studentId
        } = req.query;

        let sql = `
            SELECT 
                r.problem as keyword,
                COUNT(*) as count
            FROM join_it.tasks t
            JOIN join_it.users u ON t.intern_id = u.id
            JOIN orderit.data_report r ON t.task_staff_id = r.id
            WHERE t.deleted_at IS NULL
        `;

        const params = [];

        // Global Filters
        if (academicYear && academicYear !== 'all') { sql += ` AND u.academic_year = ?`; params.push(academicYear); }
        if (term && term !== 'all') { sql += ` AND u.term = ?`; params.push(term); }
        if (university && university !== 'all') { sql += ` AND u.university_name = ?`; params.push(university); }

        // Date Range
        if (startDate && endDate) {
            sql += ` AND r.date_report BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        // Student Mode
        if (studentMode === 'individual' && studentId && studentId !== 'all') {
            sql += ` AND u.id = ?`;
            params.push(studentId);
        }

        sql += ` GROUP BY r.problem ORDER BY count DESC LIMIT 10`;

        const [rows] = await joinPool.query(sql, params);

        // Clean labels: Remove "01.", "02." prefixes and split by " เช่น" to get concise keywords
        const labels = rows.map(r => {
            let k = r.keyword || 'ไม่ระบุ';
            // Remove "01.", "02." etc.
            k = k.replace(/^\d+\./, '').trim();
            // Take only before " เช่น" or " ("
            k = k.split(' เช่น')[0].split(' (')[0].trim();
            return k;
        });

        const counts = rows.map(r => r.count);

        res.json({
            success: true,
            chartData: {
                labels,
                datasets: [{
                    label: 'จำนวนครั้ง',
                    data: counts,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6
                }]
            }
        });
    } catch (err) {
        console.error("❌ Keywords Chart Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงข้อมูลกราฟคีย์เวิร์ดล้มเหลว" });
    }
};

// --- 6.7 ดึงรายละเอียดงานสำหรับช่อง Heatmap (Drill-down) ---
exports.getHeatmapDetails = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            category, // 'workingList', 'problemList', 'device', 'depart', 'staff'
            hour,     // integer (8-17)
            categoryValue // string value of the y-axis label
        } = req.query;

        const categoryMap = {
            workingList: 'r.device',
            problemList: 'r.problem',
            device: 'r.deviceName',
            depart: 'd.depart_name',
            staff: 'r.username'
        };

        const groupColumn = categoryMap[category] || 'r.device';

        let sql = `
            SELECT 
                r.id,
                r.date_report,
                r.time_report,
                r.deviceName,
                r.problem,
                r.status,
                d.depart_name,
                r.username as staff_name,
                r.work_type,
                r.description,
                (SELECT COUNT(*) FROM join_it.tasks t2 WHERE t2.task_staff_id = r.id AND t2.deleted_at IS NULL) as intern_count
            FROM orderit.data_report r
            JOIN orderit.depart d ON r.department = d.depart_id
            WHERE HOUR(r.time_report) = ?
        `;

        const params = [hour];

        // Filter by Date Range
        if (startDate && endDate) {
            sql += ` AND r.date_report BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        // Filter by the specific category value clicked
        if (categoryValue === 'ไม่ระบุ') {
            sql += ` AND (${groupColumn} IS NULL OR ${groupColumn} = "")`;
        } else {
            sql += ` AND ${groupColumn} = ?`;
            params.push(categoryValue);
        }

        sql += ` ORDER BY r.time_report ASC`;

        const [rows] = await joinPool.query(sql, params);

        res.json({
            success: true,
            tasks: rows
        });
    } catch (err) {
        console.error("❌ Heatmap Details Error:", err.message);
        res.status(500).json({ success: false, message: "ดึงรายละเอียดงานล้มเหลว" });
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

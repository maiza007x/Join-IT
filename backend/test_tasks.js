const db = require('./helper/db');

async function runTest() {
    console.log("=== ป้อนข้อมูลจำลอง ===");
    try {
        // 1. เพิ่มผู้ใช้ 2 คน
        await db.query(`INSERT IGNORE INTO join_it.users (id, username, password, full_name, role) VALUES 
            (991, 'user991', 'pwd', 'Test User A', 'intern'),
            (992, 'user992', 'pwd', 'Test User B', 'intern')`);
            
        // 2. จำลองงานใน orderit.data_report
        await db.query(`INSERT IGNORE INTO orderit.data_report (id, deviceName, report, date_report, time_report, username) VALUES 
            (8888, 'Test Device', 'Test Report', CURDATE(), '10:00:00', 'tester')`);
            
        // 3. จำลองให้ทั้งสองคนไปมีส่วนร่วมในงานเดียวกัน
        // คนแรกสร้าง, ดังนั้น created_by อาจเป็นของคนแรก แต่ intern_id คนละคนกัน
        await db.query(`INSERT IGNORE INTO join_it.tasks (task_staff_id, intern_id, created_by, created_at, deleted_at) VALUES 
            (8888, 991, 'Test User A', NOW(), NULL),
            (8888, 992, 'Test User A', NOW(), NULL)`);

        console.log("=== ดึงข้อมูลผ่าน Query ที่คล้ายกับ /tasks_collab ===");
        let sql = `
            SELECT 
                r.id as id,
                r.deviceName,
                r.report,
                GROUP_CONCAT(DISTINCT u.full_name SEPARATOR '||') as intern_names
            FROM orderit.data_report r
            LEFT JOIN join_it.tasks t ON r.id = t.task_staff_id AND t.deleted_at IS NULL
            LEFT JOIN join_it.users u ON t.intern_id = u.id
            WHERE r.id = 8888
            GROUP BY r.id
        `;
        const [rows] = await db.query(sql);
        console.log("Result (Raw):", rows);
        
        const formattedTasks = rows.map(task => ({
            ...task,
            interns: task.intern_names ? task.intern_names.split('||') : [],
        }));
        console.log("Result (Formatted array):", formattedTasks[0].interns);
        
        if (formattedTasks[0].interns.length === 2) {
            console.log("✅ การคืนข้อมูลเป็น list หลายคนถูกต้อง");
        } else {
            console.log("❌ ข้อผิดพลาด: ไม่พบคนช่วย 2 คน");
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
runTest();

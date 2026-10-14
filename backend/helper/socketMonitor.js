const { query } = require("./db");

const POLL_INTERVAL_MS = 10000;
const TASK_COLUMNS = "id, deviceName, report, username, time_report";

let lastId = null;
let io = null;

// id ที่แจ้งเตือนไปแล้วแต่ยังใหม่กว่า lastId (เช่น มาทาง webhook ก่อน polling) ใช้กันแจ้งเตือนซ้ำ
const notifiedIds = new Set();

/**
 * ติดตามงานใหม่จากตาราง data_report ของ Order-IT
 * polling เป็นตัวหลักที่รับประกันว่าไม่พลาดงาน ส่วน webhook (notifyTaskById) ช่วยให้แจ้งเตือนเร็วขึ้น
 */
async function startMonitoring(socketIoInstance) {
    io = socketIoInstance;

    try {
        // ครั้งแรก: หา ID ล่าสุดเก็บไว้ก่อน เพื่อไม่ให้แจ้งเตือนงานเก่า
        const [rows] = await query("SELECT MAX(id) as maxId FROM data_report", [], 'order');
        lastId = rows[0]?.maxId || 0;
        console.log(`📡 [Monitor]: Started monitoring for new tasks. Current MAX ID: ${lastId}`);
    } catch (err) {
        console.error("❌ [Monitor Error]: Failed to get initial MAX ID:", err.message);
    }

    setInterval(checkForNewTasks, POLL_INTERVAL_MS);
}

function emitNewTask(task, via) {
    if (notifiedIds.has(task.id)) return;
    notifiedIds.add(task.id);

    io.emit("new-task", {
        id: task.id,
        deviceName: task.deviceName,
        report: task.report,
        username: task.username,
        time: task.time_report,
        via
    });
}

async function checkForNewTasks() {
    if (!io) return;

    try {
        const [rows] = await query(
            `SELECT ${TASK_COLUMNS} FROM data_report WHERE id > ? AND parent_report_id IS NULL ORDER BY id ASC`,
            [lastId],
            'order'
        );

        if (rows.length > 0) {
            console.log(`🔔 [Monitor]: Found ${rows.length} new tasks!`);
            rows.forEach(task => emitNewTask(task, "polling"));
            lastId = Math.max(lastId, rows[rows.length - 1].id);
        }

        // id ที่ไม่เกิน lastId จะไม่ถูก polling เจออีก ไม่ต้องจำต่อ
        notifiedIds.forEach(id => {
            if (id <= lastId) notifiedIds.delete(id);
        });
    } catch (err) {
        console.error("❌ [Monitor Error]: Database polling failed:", err.message);
    }
}

/**
 * แจ้งเตือนงานใหม่ทันที เมื่อ Order-IT ส่ง webhook มา (อ่านรายละเอียดจาก DB เพื่อให้ข้อมูลตรงกับ polling)
 * ไม่ทำอะไรถ้าไม่พบงาน เป็นงานลูก หรือเคยแจ้งไปแล้ว
 */
async function notifyTaskById(id) {
    const [rows] = await query(
        `SELECT ${TASK_COLUMNS} FROM data_report WHERE id = ? AND parent_report_id IS NULL`,
        [id],
        'order'
    );
    if (rows.length > 0) {
        emitNewTask(rows[0], "webhook");
    }
}

module.exports = { startMonitoring, notifyTaskById };

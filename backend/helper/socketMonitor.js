const { query } = require("./db");

let lastId = null;
let io = null;

/**
 * ติดตามงานใหม่จากฐานข้อมูล orderit.data_report
 */
async function startMonitoring(socketIoInstance) {
    io = socketIoInstance;

    try {
        // ครั้งแรก: หา ID ล่าสุดเก็บไว้ก่อน เพื่อไม่ให้แจ้งเตือนงานเก่า
        const [rows] = await query("SELECT MAX(id) as maxId FROM orderit.data_report", [], 'order');
        lastId = rows[0]?.maxId || 0;
        console.log(`📡 [Monitor]: Started monitoring for new tasks. Current MAX ID: ${lastId}`);
    } catch (err) {
        console.error("❌ [Monitor Error]: Failed to get initial MAX ID:", err.message);
    }

    // เริ่ม Polling ทุกๆ 10 วินาที
    setInterval(checkForNewTasks, 10000);
}

async function checkForNewTasks() {
    if (!io) return;

    try {
        // เช็ครายการงานที่ใหม่กว่า lastId
        const [rows] = await query(
            "SELECT id, deviceName, report, username, time_report FROM orderit.data_report WHERE id > ? ORDER BY id ASC",
            [lastId],
            'order'
        );

        if (rows.length > 0) {
            console.log(`🔔 [Monitor]: Found ${rows.length} new tasks!`);

            rows.forEach(task => {
                // ส่ง Event ไปหาทุก Client ที่เชื่อมต่ออยู่
                io.emit("new-task", {
                    id: task.id,
                    deviceName: task.deviceName,
                    report: task.report,
                    username: task.username,
                    time: task.time_report
                });

                // อัปเดต lastId เป็นตัวล่าสุดที่เจอ
                if (task.id > lastId) {
                    lastId = task.id;
                }
            });
        }
    } catch (err) {
        console.error("❌ [Monitor Error]: Database polling failed:", err.message);
    }
}

/**
 * อัปเดต lastId เพื่อป้องกันการส่งซ้ำ (ใช้เมื่อได้รับข้อมูลจาก Webhook แล้ว)
 */
function setLastId(id) {
    if (id && id > lastId) {
        lastId = id;
        console.log(`📡 [Monitor]: Updated lastId to ${lastId} (via manual update)`);
    }
}

module.exports = { startMonitoring, setLastId };

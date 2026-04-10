const { orderPool } = require("../mysql");

/**
 * สคริปต์จำลองการเพิ่มงานใหม่เข้าฐานข้อมูล Order-IT 
 * เพื่อทดสอบระบบ Real-time Notification
 */
async function insertTestTask() {
    try {
        const [result] = await orderPool.query(
            `INSERT INTO data_report (deviceName, report, username, date_report, time_report, status) 
             VALUES (?, ?, ?, CURDATE(), CURTIME(), 'open')`,
            ["TEST-DEVICE-001", "ทดสอบระบบแจ้งเตือน Real-time นะจ๊ะ", "system_test"]
        );
        
        console.log("✅ [Test]: Inserted test task with ID:", result.insertId);
        process.exit(0);
    } catch (err) {
        console.error("❌ [Test Error]:", err.message);
        process.exit(1);
    }
}

insertTestTask();

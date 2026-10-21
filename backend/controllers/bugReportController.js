const fs = require('fs');
const db = require('../helper/db');

const MAX_MESSAGE_LENGTH = 250;
const LIST_LIMIT = 50;

// ดึงข้อความแจ้งปัญหา (ล่าสุดก่อน) พร้อมชื่อผู้ส่งและรูปที่แนบ
async function findBugReports({ id } = {}) {
    const [reports] = await db.query(
        `SELECT b.id, b.user_id, COALESCE(u.nickname, u.full_name, u.username) AS sender_name, u.avatar_url AS sender_avatar,
                b.message, b.is_urgent, b.created_at
         FROM bug_reports b
         LEFT JOIN users u ON u.id = b.user_id
         WHERE b.deleted_at IS NULL ${id ? 'AND b.id = ?' : ''}
         ORDER BY b.created_at DESC, b.id DESC
         LIMIT ?`,
        id ? [id, 1] : [LIST_LIMIT]
    );
    if (reports.length === 0) return [];

    const [images] = await db.query(
        'SELECT bug_report_id, file_path FROM bug_report_images WHERE bug_report_id IN (?) ORDER BY id ASC',
        [reports.map((report) => report.id)]
    );

    return reports.map((report) => ({
        ...report,
        is_urgent: !!report.is_urgent,
        images: images.filter((image) => image.bug_report_id === report.id).map((image) => image.file_path),
    }));
}

// ลบไฟล์รูปที่อัปโหลดมาแล้ว เมื่อบันทึกข้อความไม่สำเร็จ (ไม่ให้มีไฟล์ค้างที่ไม่มีข้อความ)
const removeUploadedFiles = (files = []) => {
    files.forEach((file) => fs.unlink(file.path, () => {}));
};

// --- GET /api/bug-reports (ทุกคนเห็นทุกข้อความ) ---
exports.getBugReports = async (req, res) => {
    try {
        res.json({ success: true, data: await findBugReports() });
    } catch (err) {
        console.error("Get Bug Reports Error:", err);
        res.status(500).json({ success: false, message: "ดึงข้อความแจ้งปัญหาไม่สำเร็จ" });
    }
};

// --- POST /api/bug-reports (multipart: message, is_urgent, images[]) ---
exports.createBugReport = async (req, res) => {
    const message = (req.body.message ?? '').trim();
    const isUrgent = ['1', 'true'].includes(String(req.body.is_urgent));
    const files = req.files ?? [];

    if (!message && files.length === 0) {
        return res.status(400).json({ success: false, message: "กรุณาพิมพ์ข้อความหรือแนบรูปภาพ" });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
        removeUploadedFiles(files);
        return res.status(400).json({ success: false, message: `ข้อความต้องไม่เกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร` });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO bug_reports (user_id, message, is_urgent) VALUES (?, ?, ?)',
            [req.user.id, message, isUrgent ? 1 : 0]
        );
        if (files.length > 0) {
            await conn.query(
                'INSERT INTO bug_report_images (bug_report_id, file_path) VALUES ?',
                [files.map((file) => [result.insertId, `/uploads/bug-reports/${file.filename}`])]
            );
        }
        await conn.commit();

        // ส่งแค่ id + is_urgent ทาง socket (socket ไม่ตรวจตัวตน) หน้าเว็บดึงรายละเอียดผ่าน API เอง
        req.app.get('io')?.emit('new-bug-report', { id: result.insertId, is_urgent: isUrgent });

        const [report] = await findBugReports({ id: result.insertId });
        res.status(201).json({ success: true, data: report });
    } catch (err) {
        if (conn) await conn.rollback();
        removeUploadedFiles(files);
        console.error("Create Bug Report Error:", err);
        res.status(500).json({ success: false, message: "ส่งข้อความแจ้งปัญหาไม่สำเร็จ" });
    } finally {
        if (conn) conn.release();
    }
};

// --- DELETE /api/bug-reports/:id (soft delete เฉพาะเจ้าของหรือ admin) ---
exports.deleteBugReport = async (req, res) => {
    const reportId = Number(req.params.id);

    try {
        const [rows] = await db.query(
            'SELECT user_id FROM bug_reports WHERE id = ? AND deleted_at IS NULL',
            [reportId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบข้อความนี้" });
        }
        if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "ลบได้เฉพาะข้อความของตัวเอง" });
        }

        await db.query('UPDATE bug_reports SET deleted_at = NOW() WHERE id = ?', [reportId]);
        req.app.get('io')?.emit('bug-report-deleted', { id: reportId });

        res.json({ success: true, message: "ลบข้อความเรียบร้อย" });
    } catch (err) {
        console.error("Delete Bug Report Error:", err);
        res.status(500).json({ success: false, message: "ลบข้อความไม่สำเร็จ" });
    }
};

const { query } = require("./db");

/**
 * ช่วงวันที่ฝึกงานของผู้ใช้ (YYYY-MM-DD) ใช้จำกัดการดูงาน
 * @returns {Promise<{start: string, end: string}|null>} null = ไม่จำกัด (admin หรือยังไม่ได้ระบุช่วงวันที่)
 */
async function getInternshipRange(user) {
  if (user.role === "admin") return null;

  const [rows] = await query(
    "SELECT internship_start_date AS start, internship_end_date AS end FROM users WHERE id = ?",
    [user.id]
  );
  const { start, end } = rows[0] ?? {};
  return start && end ? { start, end } : null;
}

const isWithinRange = (range, date) => !range || (date >= range.start && date <= range.end);

module.exports = { getInternshipRange, isWithinRange };

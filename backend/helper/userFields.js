const TERMS = ["เทอม 1", "เทอม 2", "ภาคฤดูร้อน"];

const isValidDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

/**
 * ตรวจข้อมูลเทอมและช่วงวันที่ฝึกงาน (ข้ามค่าที่เป็น undefined/null)
 * @returns {string|null} ข้อความ error หรือ null ถ้าถูกต้อง
 */
function validateInternshipInfo({ term, internship_start_date: start, internship_end_date: end }) {
  if (term != null && !TERMS.includes(term)) {
    return "เทอมไม่ถูกต้อง";
  }
  if ((start != null && !isValidDate(start)) || (end != null && !isValidDate(end))) {
    return "วันที่ฝึกงานไม่ถูกต้อง";
  }
  if (start != null && end != null && end < start) {
    return "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มฝึกงาน";
  }
  return null;
}

module.exports = { validateInternshipInfo };

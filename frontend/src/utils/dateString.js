// แปลง Date จาก Calendar เป็น "YYYY-MM-DD" (ตามเวลาไทย) สำหรับส่งให้ backend
export const toDateString = (date) =>
  date instanceof Date ? date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) : null;

// แปลง "YYYY-MM-DD" จาก backend เป็น Date (เวลาท้องถิ่น) สำหรับ Calendar
export const fromDateString = (value) => (value ? new Date(`${value}T00:00:00`) : null);

// แสดงวันที่แบบไทย
export const formatThaiDate = (value) =>
  value ? fromDateString(value).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "-";

// ปีการศึกษาเก็บเป็นปี พ.ศ. (เช่น "2569") แต่ Calendar แบบเลือกปีใช้ปี ค.ศ.
export const dateToAcademicYear = (date) => (date instanceof Date ? String(date.getFullYear() + 543) : null);

export const academicYearToDate = (value) => {
  const year = Number(value) - 543;
  return Number.isNaN(year) || !value ? null : new Date(year, 0, 1);
};

export const formatAcademicYear = (date) => (date instanceof Date ? `ปีการศึกษา พ.ศ. ${date.getFullYear() + 543}` : null);

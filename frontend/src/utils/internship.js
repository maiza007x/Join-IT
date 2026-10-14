import { toDateString } from "./dateString";

// สถานะช่วงฝึกงานของผู้ใช้ (null = ไม่จำกัด เช่น admin หรือยังไม่ได้ระบุช่วงวันที่)
export const getInternshipStatus = (user) => {
  const { internship_start_date: start, internship_end_date: end } = user ?? {};
  if (user?.role === "admin" || !start || !end) return null;

  const today = toDateString(new Date());
  return { start, end, notStarted: today < start, ended: today > end };
};

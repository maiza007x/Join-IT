// ค่าที่ใช้ร่วมกันของ "งานเจ้าหน้าที่" (ตารางและไทม์ไลน์ในหน้างานวันนี้)

// ระดับความเร่งด่วน (data_report.priority)
export const PRIORITIES = {
  1: { label: "⏰งานประจำวัน", emoji: "⏰", className: "text-cyan-600" },
  2: { label: "🔵 ปกติ", emoji: "🔵", className: "text-emerald-600" },
  3: { label: "🟡กลาง", emoji: "🟡", className: "text-amber-600" },
  4: { label: "🔴 เร่งด่วน", emoji: "🔴", className: "text-rose-600" },
};

export const ROUTINE_PRIORITY = "1";

export const getPriorityText = (priority) => PRIORITIES[priority]?.label ?? "-";

// สถานะงาน (data_report.status); 1 = ยกเลิก ไม่ถูกส่งมาจาก backend
export const STATUS_LABELS = {
  0: "ยังไม่มีคนรับ",
  2: "กำลังดำเนินงาน",
  3: "รออะไหล่",
  4: "เสร็จสิ้น",
  6: "เสร็จสิ้น",
};

// เจ้าหน้าที่รับงาน: แสดงชื่อเล่น ถ้ายังไม่มีให้แสดง @username
export const getStaffName = (task) => task.staff_nickname || (task.username ? `@${task.username}` : "-");

// งานที่ยังไม่มีนักศึกษาช่วย
export const hasNoHelper = (task) => !task.interns || task.interns.length === 0;

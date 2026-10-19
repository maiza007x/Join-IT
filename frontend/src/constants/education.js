// ระดับการศึกษามาตรฐาน; ค่า "อื่นๆ" ให้ผู้ใช้พิมพ์เอง และเก็บข้อความที่พิมพ์ลง DB
export const EDUCATION_LEVELS = ["ปวช.", "ปวส.", "ปริญญาตรี"];
export const EDUCATION_OTHER = "อื่นๆ";

export const EDUCATION_OPTIONS = [...EDUCATION_LEVELS, EDUCATION_OTHER].map((level) => ({ label: level, value: level }));

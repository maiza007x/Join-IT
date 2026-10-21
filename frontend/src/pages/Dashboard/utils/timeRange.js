// แปลงตัวเลือก "ช่วงเวลา" ของ Dashboard เป็นวันที่เริ่ม/สิ้นสุด (YYYY-MM-DD) ให้ทุกส่วนใช้ช่วงเดียวกัน
// "all" คืนค่า undefined ทั้งคู่ = ไม่จำกัดช่วงเวลา
export const getTimeRangeBounds = (timeRange, customDates) => {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);

  if (timeRange === "week") {
    const day = today.getDay();
    start.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    end = new Date(start);
    end.setDate(start.getDate() + 4); // จันทร์ - ศุกร์
  } else if (timeRange === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (timeRange === "custom" && customDates?.length === 2) {
    if (customDates[0]) start = new Date(customDates[0]);
    if (customDates[1]) end = new Date(customDates[1]);
  } else if (timeRange === "all") {
    return { startDate: undefined, endDate: undefined };
  }

  const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: format(start), endDate: format(end) };
};

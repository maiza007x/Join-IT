// ไทม์ไลน์แบบ Gantt: แถว = คน/กลุ่ม, แกนนอน = เวลาในวัน (ชั่วโมงทศนิยม เช่น 9.5 = 09:30)
// งานที่เวลาทับกันในแถวเดียวกันจะถูกจัดเป็นชั้น (lane) ซ้อนลงด้านล่าง
// ใช้ร่วมกันระหว่างกราฟ Workload ใน Dashboard และหน้างานวันนี้

const LANE_HEIGHT = 36; // ความสูงแถบ 32px + ระยะห่าง 4px

// จัดงานเป็นชั้น: แต่ละงานลงชั้นแรกที่งานก่อนหน้าจบแล้ว ถ้าไม่มีให้เปิดชั้นใหม่
const packTasksIntoLanes = (tasks) => {
  const sortedTasks = [...tasks].sort((a, b) => a.start - b.start);
  const lanes = []; // เวลาจบของงานล่าสุดในแต่ละชั้น

  return sortedTasks.map((task) => {
    const taskEnd = task.start + task.duration;
    let laneIndex = lanes.findIndex((laneEnd) => task.start >= laneEnd);

    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push(taskEnd);
    } else {
      lanes[laneIndex] = taskEnd;
    }
    return { ...task, lane: laneIndex };
  });
};

const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

/**
 * @param rows       [{ key, label, tasks: [{ id, start, duration, ... }] }]
 * @param renderBar  (task, position) => element ของแถบงาน; position = { left, width, top } ให้ใส่ใน style
 * @param startHour  ชั่วโมงเริ่มของแกนเวลา (ค่าเริ่มต้น 8)
 * @param endHour    ชั่วโมงสุดท้ายของแกนเวลา (ค่าเริ่มต้น 17)
 * @param nowHour    (ไม่บังคับ) ชั่วโมงปัจจุบัน แสดงเส้นแนวตั้งและป้ายเวลา
 * @param halfHourLines (ไม่บังคับ) แสดงเส้นและป้ายเวลาทุกครึ่งชั่วโมงแบบจาง
 * @param labelWidth ความกว้างช่องชื่อแถว (px) ค่าเริ่มต้น 96
 * @param labelClassName รูปแบบตัวอักษรของชื่อแถว
 * @param emptyMessage ข้อความเมื่อไม่มีแถว
 */
function Timeline({
  rows,
  renderBar,
  startHour = 8,
  endHour = 17,
  nowHour,
  halfHourLines = false,
  labelWidth = 96,
  labelClassName = "text-[11px] font-medium text-slate-600",
  emptyMessage = "ไม่มีข้อมูล",
}) {
  const totalHours = endHour - startHour;
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  const toPercent = (hour) => `${((hour - startHour) / totalHours) * 100}%`;

  const getPosition = (task) => ({
    left: `${((task.start - startHour) / totalHours) * 100}%`,
    width: `${(task.duration / totalHours) * 100}%`,
    top: `${task.lane * LANE_HEIGHT + 4}px`,
  });

  return (
    <>
      <div className="relative mb-3 border-b border-slate-200 h-6" style={{ marginLeft: labelWidth }}>
        <div className="absolute inset-0 right-2">
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute text-[10px] font-bold text-slate-400 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${(i / totalHours) * 100}%` }}
            >
              {formatHour(hour)}
            </div>
          ))}
          {halfHourLines && hours.slice(0, -1).map((hour) => (
            <div
              key={`half-${hour}`}
              className="absolute text-[9px] text-slate-300 -translate-x-1/2 whitespace-nowrap"
              style={{ left: toPercent(hour + 0.5) }}
            >
              {String(hour).padStart(2, "0")}:30
            </div>
          ))}
          {nowHour !== undefined && (
            <div
              className="absolute -top-1 -translate-x-1/2 px-1.5 rounded bg-rose-500 text-white text-[10px] font-bold whitespace-nowrap z-10"
              style={{ left: toPercent(nowHour) }}
            >
              {`${String(Math.floor(nowHour)).padStart(2, "0")}:${String(Math.floor((nowHour % 1) * 60)).padStart(2, "0")}`}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 relative mt-1 overflow-y-auto max-h-[400px] pr-2">
        <div className="absolute inset-0 right-2 flex pointer-events-none" style={{ marginLeft: labelWidth }}>
          {Array.from({ length: totalHours }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-slate-100 border-dashed h-full"></div>
          ))}
          <div className="border-l border-slate-100 border-dashed h-full"></div>
          {halfHourLines && hours.slice(0, -1).map((hour) => (
            <div
              key={`half-${hour}`}
              className="absolute top-0 bottom-0 border-l border-slate-100/70 border-dotted"
              style={{ left: toPercent(hour + 0.5) }}
            ></div>
          ))}
          {nowHour !== undefined && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500/70 z-10"
              style={{ left: toPercent(nowHour) }}
              title="เวลาปัจจุบัน"
            ></div>
          )}
        </div>

        {rows.length > 0 ? rows.map((row) => {
          const packedTasks = packTasksIntoLanes(row.tasks);
          const laneCount = packedTasks.length > 0 ? Math.max(...packedTasks.map((task) => task.lane)) + 1 : 1;

          return (
            <div key={row.key} className="flex border-b border-slate-50 relative transition-all duration-300" style={{ minHeight: `${laneCount * LANE_HEIGHT + 8}px` }}>
              <div className={`shrink-0 truncate pr-2 pt-2 ${labelClassName}`} style={{ width: labelWidth }} title={row.label}>
                {row.label}
              </div>
              <div className="flex-1 relative">
                {packedTasks.map((task) => renderBar(task, getPosition(task)))}
              </div>
            </div>
          );
        }) : (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            {emptyMessage}
          </div>
        )}
      </div>
    </>
  );
}

export default Timeline;

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OverlayPanel } from "primereact/overlaypanel";
import Timeline from "../components/timeline/Timeline";
import { toDateString } from "../utils/dateString";
import {
  PRIORITIES,
  ROUTINE_PRIORITY,
  STATUS_LABELS,
  getStaffName,
  hasNoHelper,
} from "../utils/staffTask";

const SHOW_ROUTINE_KEY = "joinit_staffTimelineShowRoutine";
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 17;
const MIN_DURATION = 1 / 6; // แถบสั้นสุด 10 นาที ให้คลิก/มองเห็นได้

// "HH:MM:SS(.ffffff)" -> ชั่วโมงทศนิยม
const toHours = (time) => {
  const [h, m, s] = time.split(":").map(Number);
  return h + m / 60 + (s || 0) / 3600;
};

const formatHours = (hours) => {
  const totalMinutes = Math.round(hours * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
};

// งานที่ยังไม่มีเวลาปิด (null หรือ 00:00) ถือว่ายังเปิดอยู่
const hasNoEndTime = (task) => !task.end_time || task.end_time.startsWith("00:00");

// สีพื้นแถบ = อุปกรณ์ (แบบ Order-IT): อุปกรณ์ในวันนั้นเรียงตามชื่อแล้วไล่สีตามลำดับ
// ใช้โทนจากชุดสีของ Order-IT แต่ไม่ใช้ส้ม/แดง เพราะส้มคือ "ยังไม่มีคนช่วย" และแดงคือเร่งด่วน
const DEVICE_COLORS = ["#4f46e5", "#10b981", "#8b5cf6", "#ec4b99", "#14b8a6", "#0ea5e9", "#65a30d", "#475569"];
const NO_DEVICE = { label: "ไม่ระบุอุปกรณ์", color: "#94a3b8" };
const getDeviceLabel = (task) => task.deviceName || NO_DEVICE.label;

const URGENT_PRIORITY = "4";
const UNASSIGNED_ROW = { key: "__unassigned", label: "รอเจ้าหน้าที่รับงาน" };

const SYMBOL_LEGEND = [
  { label: "ยังไม่มีคนช่วย", swatch: <div className="w-4 h-3 rounded-sm bg-slate-200 border-t-4 border-orange-400"></div> },
  { label: "ฉันผูกงานแล้ว", swatch: <i className="pi pi-check-circle text-blue-600 text-xs"></i> },
  { label: "มีคนช่วยแล้ว", swatch: <span className="text-[11px]">👥</span> },
  { label: "เร่งด่วน", swatch: <span className="text-[11px]">🔴</span> },
];

// ไทม์ไลน์งานเจ้าหน้าที่ (แถว = เจ้าหน้าที่) ใช้ข้อมูลชุดเดียวกับตาราง
function StaffTimeline({ tasks, highlightTaskId, actionLoading, confirmJoin, confirmLeave, onShowDetail, canJoin }) {
  const [showRoutine, setShowRoutine] = useState(() => localStorage.getItem(SHOW_ROUTINE_KEY) === "true");
  const [tooltip, setTooltip] = useState(null); // { task, x, y }
  const [selectedId, setSelectedId] = useState(null);
  const cardRef = useRef(null);
  // อ่านจากรายการล่าสุด เพื่อให้สถานะในการ์ดเปลี่ยนตามหลังผูก/ยกเลิก
  const selected = tasks.find((task) => task.id === selectedId);

  useEffect(() => {
    localStorage.setItem(SHOW_ROUTINE_KEY, showRoutine);
  }, [showRoutine]);

  const routineCount = tasks.filter((task) => String(task.priority) === ROUTINE_PRIORITY).length;
  const visibleTasks = showRoutine ? tasks : tasks.filter((task) => String(task.priority) !== ROUTINE_PRIORITY);

  // ทุกงานในหน้านี้เป็นวันเดียวกัน (วันที่เลือก)
  const isToday = visibleTasks.length > 0 && visibleTasks[0].date_report === toDateString(new Date());
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;

  // งานที่ยังไม่ปิด: วันนี้ยาวถึงเวลาปัจจุบัน, วันที่ผ่านมาแล้วยาวถึงท้ายแกนเวลา
  const timed = visibleTasks.map((task) => {
    const start = toHours(task.time_report);
    const end = hasNoEndTime(task) ? (isToday ? nowHours : null) : toHours(task.end_time);
    return { task, start, end };
  });

  // ขยายแกนเวลาอัตโนมัติถ้ามีงานนอก 08:00-17:00
  const startHour = Math.min(DEFAULT_START_HOUR, ...timed.map(({ start }) => Math.floor(start)));
  const endHour = Math.max(
    DEFAULT_END_HOUR,
    ...timed.map(({ start, end }) => Math.ceil(Math.max(start + MIN_DURATION, end ?? 0))),
    isToday ? Math.ceil(nowHours) : 0
  );

  const rowsByStaff = new Map();
  timed.forEach(({ task, start, end }) => {
    const finish = Math.max(end ?? endHour, start + MIN_DURATION);
    const row = task.username ? { key: task.username, label: getStaffName(task) } : UNASSIGNED_ROW;
    if (!rowsByStaff.has(row.key)) rowsByStaff.set(row.key, { ...row, tasks: [] });
    rowsByStaff.get(row.key).tasks.push({ ...task, start, duration: finish - start });
  });
  const unassignedRow = rowsByStaff.get(UNASSIGNED_ROW.key);
  rowsByStaff.delete(UNASSIGNED_ROW.key);
  const rows = [
    ...(unassignedRow ? [unassignedRow] : []),
    ...[...rowsByStaff.values()].sort((a, b) => a.label.localeCompare(b.label, "th")),
  ];

  // อุปกรณ์ที่มีในวันนั้น -> สี (ใช้ทั้งแถบและคำอธิบายสี)
  const deviceColors = new Map(
    [...new Set(visibleTasks.filter((task) => task.deviceName).map((task) => task.deviceName))]
      .sort((a, b) => a.localeCompare(b, "th"))
      .map((name, i) => [name, DEVICE_COLORS[i % DEVICE_COLORS.length]])
  );
  if (visibleTasks.some((task) => !task.deviceName)) deviceColors.set(NO_DEVICE.label, NO_DEVICE.color);
  const getDeviceColor = (task) => deviceColors.get(getDeviceLabel(task));

  const handleBarClick = (task, event) => {
    setTooltip(null);
    setSelectedId(task.id);
    cardRef.current.toggle(event);
  };

  // ปิดการ์ดก่อนเปิดหน้ายืนยัน แล้วใช้การผูก/ยกเลิกเดิมของหน้างานวันนี้
  const runAction = (action) => {
    cardRef.current.hide();
    action(selected.id);
  };

  const renderBar = (task, position) => {
    const ringClass = task.id === highlightTaskId
      ? "ring-4 ring-blue-300 animate-pulse"
      : task.isContributedByMe ? "ring-2 ring-blue-600 ring-offset-1" : "";

    return (
      <div
        key={task.id}
        onClick={(e) => handleBarClick(task, e)}
        className={`absolute h-8 rounded-lg px-2 flex items-center gap-1 overflow-hidden shadow-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${ringClass}`}
        style={{ ...position, backgroundColor: getDeviceColor(task) }}
        onMouseEnter={(e) => setTooltip({ task, x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setTooltip((prev) => prev && { ...prev, x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* แถบขอบบนสีส้ม = ยังไม่มีคนช่วย */}
        {hasNoHelper(task) && <div className="absolute top-0 left-0 w-full h-[5px] bg-orange-400"></div>}
        {task.isContributedByMe && <i className="pi pi-check-circle text-[11px] shrink-0"></i>}
        <span className="text-[11px] font-bold truncate leading-none drop-shadow-sm">
          {String(task.priority) === URGENT_PRIORITY && "🔴 "}{task.report}
        </span>
        {!hasNoHelper(task) && (
          <span className="ml-auto shrink-0 text-[10px] font-bold bg-white/25 rounded px-1 leading-4">
            👥{task.interns.length}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[11px] font-bold text-slate-400">อุปกรณ์</span>
            {[...deviceColors].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                <span className="text-[11px] text-slate-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[11px] font-bold text-slate-400">สัญลักษณ์</span>
            {SYMBOL_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                {item.swatch}
                <span className="text-[11px] text-slate-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
          <input type="checkbox" checked={showRoutine} onChange={(e) => setShowRoutine(e.target.checked)} />
          แสดงงานประจำวัน ({routineCount})
        </label>
      </div>

      <Timeline
        rows={rows}
        startHour={startHour}
        endHour={endHour}
        nowHour={isToday ? nowHours : undefined}
        halfHourLines
        labelWidth={120}
        labelClassName="text-sm font-bold text-slate-700"
        emptyMessage="ไม่มีงานเจ้าหน้าที่ในวันที่เลือก"
        renderBar={renderBar}
      />

      <OverlayPanel ref={cardRef} className="w-80">
        {selected && (
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <div className="font-bold text-base text-slate-900">
              {PRIORITIES[selected.priority]?.emoji} {selected.deviceName}
            </div>
            {selected.department_name && (
              <div className="text-xs text-slate-400">
                <i className="pi pi-map-marker text-[10px] mr-1"></i>{selected.department_name}
              </div>
            )}
            <p className="m-0 whitespace-pre-wrap break-words">{selected.report}</p>
            <div className="text-xs text-slate-500 flex flex-col gap-1 bg-slate-50 rounded-lg p-2">
              <span>
                <i className="pi pi-clock text-[10px] mr-1"></i>
                {selected.time_report.slice(0, 5)}
                {hasNoEndTime(selected) ? " - ยังไม่ปิดงาน" : ` - ${selected.end_time.slice(0, 5)} น.`}
              </span>
              <span>เจ้าหน้าที่: {getStaffName(selected)}</span>
              <span>สถานะ: {STATUS_LABELS[selected.status] ?? "-"}</span>
              <span>ผู้ช่วย: {hasNoHelper(selected) ? "ยังไม่มี" : selected.interns.join(", ")}</span>
            </div>
            <div className="flex gap-2 mt-1">
              {canJoin && (
              <button
                type="button"
                onClick={() => runAction(selected.isContributedByMe ? confirmLeave : confirmJoin)}
                disabled={actionLoading === selected.id}
                className={`flex-1 h-10 rounded-xl border-none text-white text-sm font-bold cursor-pointer disabled:opacity-50 ${selected.isContributedByMe ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-700"}`}
              >
                <i className={`pi ${actionLoading === selected.id ? "pi-spin pi-spinner" : selected.isContributedByMe ? "pi-times" : "pi-plus"} text-xs mr-1.5`}></i>
                {selected.isContributedByMe ? "ยกเลิก" : "ผูกงาน"}
              </button>
              )}
              <button
                type="button"
                onClick={() => {
                  cardRef.current.hide();
                  onShowDetail(selected);
                }}
                className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold cursor-pointer hover:bg-slate-50"
              >
                <i className="pi pi-eye text-xs mr-1.5"></i>
                ดูรายละเอียด
              </button>
            </div>
          </div>
        )}
      </OverlayPanel>

      {tooltip && createPortal(
        <div className="fixed pointer-events-none z-[9999]" style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}>
          <div className="bg-slate-900/95 border border-white/10 shadow-2xl rounded-xl p-3 min-w-[220px] max-w-[320px] text-slate-200 text-[11px] flex flex-col gap-1.5">
            <div className="text-[13px] font-bold text-white border-b border-white/10 pb-2 mb-1 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: getDeviceColor(tooltip.task) }}></div>
              {tooltip.task.deviceName}
            </div>
            <div>ประเภทงาน: {tooltip.task.device || "-"} · {PRIORITIES[tooltip.task.priority]?.label ?? "-"}</div>
            <div className="whitespace-pre-wrap break-words">{tooltip.task.report}</div>
            <div>
              <i className="pi pi-clock text-[10px] text-indigo-400 mr-1"></i>
              {formatHours(tooltip.task.start)}
              {hasNoEndTime(tooltip.task) ? " - ยังไม่ปิดงาน" : ` - ${formatHours(tooltip.task.start + tooltip.task.duration)} น.`}
            </div>
            <div>เจ้าหน้าที่: {getStaffName(tooltip.task)}</div>
            <div>สถานะ: {STATUS_LABELS[tooltip.task.status] ?? "-"}</div>
            <div>ผู้ช่วย: {hasNoHelper(tooltip.task) ? "ยังไม่มี" : tooltip.task.interns.join(", ")}</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default StaffTimeline;

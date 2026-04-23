import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Skeleton } from "primereact/skeleton";
import api from "../../../services/api";

const getWeekRange = (date) => {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);

  const weekDates = [];
  const daysTh = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
  for (let i = 0; i < 5; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    weekDates.push({
      date: current,
      label: `${daysTh[i]} (${current.getDate()})`
    });
  }

  const startOfWeek = new Date(monday);
  const endOfWeek = new Date(monday);
  endOfWeek.setDate(monday.getDate() + 6); // Sunday

  return { startOfWeek, endOfWeek, weekDates };
};

const getTimeRangeBounds = (timeRange, customDates) => {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);

  if (timeRange === "today") {
    // Keep today
  } else if (timeRange === "week") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    end = new Date(start);
    end.setDate(start.getDate() + 4); // Mon to Fri
  } else if (timeRange === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (timeRange === "custom" && customDates && customDates.length === 2) {
    if (customDates[0]) start = new Date(customDates[0]);
    if (customDates[1]) end = new Date(customDates[1]);
  } else if (timeRange === "all") {
    return { startDate: undefined, endDate: undefined };
  }

  const format = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: format(start), endDate: format(end) };
};

const WorkloadChart = ({ globalFilter }) => {
  const [view, setView] = useState("gantt");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ ganttData: [], barData: { labels: [], datasets: [] } });
  const [groupingCategory, setGroupingCategory] = useState("device");
  const [localFilters, setLocalFilters] = useState({
    date: new Date(),
  });

  // Custom Tooltip State
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: null,
    color: "#4f46e5",
  });
  const [filterOptions, setFilterOptions] = useState({
    workingList: [],
    problemList: [],
    device: [],
    depart: [],
    staff: [],
  });

  const handleDateChange = (direction) => {
    setLocalFilters(prev => {
      const current = prev.date ? new Date(prev.date) : new Date();
      const daysToAdd = globalFilter.person === "all" ? 1 : 7;
      current.setDate(current.getDate() + (direction * daysToAdd));
      return { ...prev, date: current };
    });
  };

  const ganttHours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  const categories = [
    { label: "อุปกรณ์", value: "device" },
    { label: "รูปแบบ activity", value: "problemList" },
    { label: "หน่วยงาน", value: "depart" },
    { label: "ร่วมงานกับเจ้าหน้าที่", value: "staff" },
    { label: "รูปแบบการทำงาน", value: "workingList" },
  ];

  const packTasksIntoLanes = (tasks) => {
    // 1. เรียงงานตามเวลาเริ่มต้น
    const sortedTasks = [...tasks].sort((a, b) => a.start - b.start);
    const lanes = []; // เก็บเวลาจบ (End time) ของงานล่าสุดในแต่ละเลน

    return sortedTasks.map(task => {
      let placed = false;
      let laneIndex = 0;
      const taskEnd = task.start + task.duration;

      // 2. หาเลนแรกที่ว่าง (เวลาเริ่มของงาน >= เวลาจบของงานในเลนนั้น)
      for (let i = 0; i < lanes.length; i++) {
        if (task.start >= lanes[i]) {
          laneIndex = i;
          lanes[i] = taskEnd; // อัปเดตเวลาจบของเลนนี้
          placed = true;
          break;
        }
      }

      // 3. ถ้าไม่มีเลนว่างเลย ให้เปิดเลนใหม่ด้านล่าง
      if (!placed) {
        laneIndex = lanes.length;
        lanes.push(taskEnd);
      }

      // 4. ส่งค่า lane กลับไปพร้อมกับ object งานเดิม
      return { ...task, lane: laneIndex };
    });
  };

  // Fetch local filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await api.get("/tasks/workload-filters");
        if (response.data.success) {
          setFilterOptions(response.data.filters);
        }
      } catch (err) {
        console.error("Failed to fetch workload filters", err);
      }
    };
    fetchFilters();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let queryStartDate = undefined;
      let queryEndDate = undefined;

      if (view === "gantt") {
        if (globalFilter.person !== "all") {
          const { startOfWeek, endOfWeek } = getWeekRange(localFilters.date);
          queryStartDate = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
          queryEndDate = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;
        } else {
          const d = localFilters.date || new Date();
          queryStartDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          queryEndDate = queryStartDate;
        }
      } else if (view === "bar") {
        const bounds = getTimeRangeBounds(globalFilter.timeRange, globalFilter.customDates);
        queryStartDate = bounds.startDate;
        queryEndDate = bounds.endDate;
      }

      const params = {
        studentMode: globalFilter.person === "all" ? "all" : "individual",
        studentId: globalFilter.person !== "all" ? globalFilter.person : undefined,
        academicYear: globalFilter.year,
        term: globalFilter.term,
        university: globalFilter.university !== "all" ? globalFilter.university : undefined,
        groupingCategory: groupingCategory,
        startDate: queryStartDate,
        endDate: queryEndDate,
        view: view,
        timeRange: globalFilter.timeRange
      };

      const response = await api.get("/tasks/workload-chart", { params });
      if (response.data.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch workload data", err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter, localFilters, view, groupingCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for Custom Tooltip
  const handleMouseEnter = (task, color, event) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: task,
      color: color,
    });
  };

  const handleMouseMove = (event) => {
    if (tooltip.visible) {
      setTooltip((prev) => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  const getGanttStyle = (start, duration) => {
    const totalHours = 9;
    const leftPercent = ((start - 8) / totalHours) * 100;
    const widthPercent = (duration / totalHours) * 100;
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const chartConfig = {
    plugins: {
      legend: {
        labels: { color: "#64748b", font: { family: "inherit", size: 11 } },
        position: "bottom",
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: "#94a3b8", font: { family: "inherit", size: 11 } } },
      y: { stacked: true, grid: { color: "#f1f5f9" }, border: { dash: [4, 4] }, ticks: { color: "#94a3b8", font: { family: "inherit", size: 11 } } },
    },
    maintainAspectRatio: true,
  };

  const yLabels = [...new Set(data.ganttData.map(t => t.yLabel))];
  // If individual mode, ensure Mon-Fri are shown even if empty
  const displayYLabels = globalFilter.person === "all"
    ? yLabels
    : getWeekRange(localFilters.date).weekDates.map(w => w.label);

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-base font-bold text-slate-800 m-0 shrink-0">ปริมาณภาระงาน (Workload)</h3>
          <div className="flex gap-2 items-center">
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
              <button
                onClick={() => setView("gantt")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "gantt" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <i className="pi pi-align-left mr-1.5"></i>ไทม์ไลน์
              </button>
              <button
                onClick={() => setView("bar")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "bar" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <i className="pi pi-chart-bar mr-1.5"></i>สรุปจำนวน
              </button>
            </div>
          </div>
        </div>

        {/* Local Filters Row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-60">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ดูข้อมูลตามหมวดหมู่</label>
            <Dropdown
              value={groupingCategory}
              options={categories}
              onChange={(e) => setGroupingCategory(e.value)}
              placeholder="เลือกหมวดหมู่"
              className="w-full text-sm h-10 flex items-center border-slate-200 bg-white rounded-lg shadow-sm"
            />
          </div>

          {view === "gantt" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">วันที่ (Timeline)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDateChange(-1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all"
                  title={globalFilter.person === "all" ? "ย้อนกลับ 1 วัน" : "ย้อนกลับ 1 สัปดาห์"}
                >
                  <i className="pi pi-chevron-left text-xs"></i>
                </button>
                <Calendar
                  value={localFilters.date}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, date: e.value }))}
                  dateFormat="dd/mm/yy"
                  className="w-40 h-10"
                  inputClassName="text-sm border-slate-200 bg-white rounded-lg shadow-sm"
                />
                <button
                  onClick={() => handleDateChange(1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all"
                  title={globalFilter.person === "all" ? "ถัดไป 1 วัน" : "ถัดไป 1 สัปดาห์"}
                >
                  <i className="pi pi-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      <div className="p-5 grow min-h-[350px] relative">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton height="2rem" width="100%" />
            <Skeleton height="15rem" width="100%" />
          </div>
        ) : view === "bar" ? (
          <Chart type="bar" data={data.barData} options={chartConfig} />
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="relative mb-3 ml-24 border-b border-slate-200 h-6">
              <div className="absolute inset-0 right-2">
                {ganttHours.map((hour, i) => (
                  <div
                    key={i}
                    className="absolute text-[10px] font-bold text-slate-400 -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${(i / (ganttHours.length - 1)) * 100}%` }}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3 relative mt-1 overflow-y-auto max-h-[400px] pr-2">
              <div className="absolute inset-0 ml-24 right-2 flex pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex-1 border-l border-slate-100 border-dashed h-full"></div>
                ))}
                <div className="border-l border-slate-100 border-dashed h-full"></div>
              </div>
              {displayYLabels.length > 0 ? displayYLabels.map((label, idx) => {
                // ดึงงานเฉพาะแถวนี้มา
                const rowTasksRaw = data.ganttData.filter((t) => t.yLabel === label);

                // รันอัลกอริทึมจัดเลน
                const packedTasks = packTasksIntoLanes(rowTasksRaw);

                // หาจำนวนเลนที่เยอะที่สุด เพื่อคำนวณความสูงของแถว
                const maxLanes = packedTasks.length > 0 ? Math.max(...packedTasks.map(t => t.lane)) + 1 : 1;
                const laneHeight = 36; // ความสูงงาน 32px + ระยะห่าง 4px
                const rowHeight = maxLanes * laneHeight + 8; // เผื่อ Padding บนล่าง

                return (
                  // กำหนดความสูงของแถวให้แปรผันตามจำนวนเลน (style={{ minHeight: rowHeight }})
                  <div key={idx} className="flex border-b border-slate-50 relative transition-all duration-300" style={{ minHeight: `${rowHeight}px` }}>

                    {/* Label ชื่อแถว */}
                    <div className="w-24 text-[11px] font-medium text-slate-600 shrink-0 truncate pr-2 pt-2" title={label}>
                      {label}
                    </div>

                    {/* พื้นที่วางบล็อกงาน */}
                    <div className="flex-1 relative">
                      {packedTasks.map((task) => {
                        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4b99', '#14b8a6', '#f97316'];
                        const catIndex = [...new Set(data.ganttData.map(t => t.category))].indexOf(task.category);
                        const bgColor = colors[catIndex % colors.length];

                        return (
                          <div
                            key={task.id}
                            className="absolute h-8 rounded-md shadow-sm border px-2 flex items-center overflow-hidden cursor-pointer hover:brightness-95 transition-all text-white"
                            style={{
                              ...getGanttStyle(task.start, task.duration),
                              backgroundColor: bgColor,
                              borderColor: bgColor,
                              // 🟢 หัวใจสำคัญ: กำหนดตำแหน่งบนแกน Y (top) ตามเลนที่มันอยู่
                              top: `${(task.lane * laneHeight) + 4}px`
                            }}
                            onMouseEnter={(e) => handleMouseEnter(task, bgColor, e)}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                          >
                            <span className="text-[9px] font-semibold truncate leading-none drop-shadow-sm">{task.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }) : (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                  ไม่มีข้อมูลภาระงานในวันที่เลือก
                </div>
              )}
            </div>
            {/* Legend for Gantt */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
              {[...new Set(data.ganttData.map(t => t.category))].map((cat, idx) => {
                const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4b99', '#14b8a6', '#f97316'];
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                    <span className="text-[10px] text-slate-500 font-medium">{cat || 'ไม่ระบุ'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Premium Tooltip via Portal */}
      {tooltip.visible && tooltip.data && createPortal(
        <div
          className="fixed pointer-events-none z-[9999] premium-tooltip-custom"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-3 min-w-[200px]">
            <div className="text-[13px] font-bold text-white border-b border-white/10 pb-2 mb-2 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: tooltip.color }}></div>
              {tooltip.data.title}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">หมวดหมู่</span>
                <span className="text-[11px] text-slate-200 font-medium bg-white/5 px-2 py-0.5 rounded-md">
                  {tooltip.data.category || 'ไม่ระบุ'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <i className="pi pi-clock text-[10px] text-indigo-400"></i>
                <span className="text-[11px] text-slate-200 font-bold">
                  {tooltip.data.start.toFixed(2)} - {(tooltip.data.start + tooltip.data.duration).toFixed(2)} น.
                </span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -left-1 top-4 w-2 h-2 bg-slate-900/95 rotate-45 border-l border-b border-white/10"></div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default WorkloadChart;


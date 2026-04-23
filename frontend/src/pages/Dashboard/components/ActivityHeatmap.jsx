import React, { useState, useEffect, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import { Sidebar } from "primereact/sidebar";
import { Tag } from "primereact/tag";
import api from "../../../services/api";

const ActivityHeatmap = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState({ yLabels: [], hours: [], matrix: [] });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem("heatmapSelectedCategory") || "device";
  });

  useEffect(() => {
    localStorage.setItem("heatmapSelectedCategory", selectedCategory);
  }, [selectedCategory]);

  // Sidebar State
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarTasks, setSidebarTasks] = useState([]);
  const [sidebarTitle, setSidebarTitle] = useState("");

  const categories = [
    { label: "อุปกรณ์", value: "device" },
    { label: "รูปแบบ activity", value: "problemList" },
    { label: "หน่วยงาน", value: "depart" },
    { label: "เจ้าหน้าที่รับงาน", value: "staff" },
    { label: "รูปแบบการทำงาน", value: "workingList" },
  ];

  const getHeatmapColor = (val) => {
    if (val === 0) return "bg-slate-50 border border-slate-100 opacity-30";
    if (val <= 1) return "bg-indigo-50 text-indigo-700";
    if (val <= 3) return "bg-indigo-100 text-indigo-800";
    if (val <= 6) return "bg-indigo-200 text-indigo-900";
    if (val <= 10) return "bg-indigo-300 text-indigo-950";
    if (val <= 20) return "bg-indigo-400 text-white";
    if (val <= 35) return "bg-indigo-500 text-white";
    if (val <= 50) return "bg-indigo-600 text-white";
    if (val <= 80) return "bg-indigo-700 text-white";
    return "bg-indigo-900 text-white";
  };

  const getTimeRangeBounds = (timeRange, customDates) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (timeRange === "today") {
    } else if (timeRange === "week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 4);
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

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getTimeRangeBounds(globalFilter.timeRange, globalFilter.customDates);

      const params = {
        category: selectedCategory,
        startDate,
        endDate
      };

      const response = await api.get("/tasks/heatmap-chart", { params });
      if (response.data.success) {
        setHeatmapData(response.data.heatmapData);
      }
    } catch (err) {
      console.error("Failed to fetch heatmap data", err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter, selectedCategory]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  // Handle Cell Click
  const handleCellClick = async (categoryValue, hourLabel, count) => {
    if (count === 0) return;

    setSidebarTitle(`${categoryValue} - เวลา ${hourLabel} น.`);
    setSidebarVisible(true);
    setSidebarLoading(true);
    setSidebarTasks([]);

    try {
      const { startDate, endDate } = getTimeRangeBounds(globalFilter.timeRange, globalFilter.customDates);
      const hour = parseInt(hourLabel.split(":")[0]);

      const params = {
        category: selectedCategory,
        categoryValue,
        hour,
        startDate,
        endDate
      };

      const response = await api.get("/tasks/heatmap-details", { params });
      if (response.data.success) {
        setSidebarTasks(response.data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch heatmap details", err);
    } finally {
      setSidebarLoading(false);
    }
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case "6": return "success";
      case "5": return "success";
      case "4": return "success";
      case "3": return "info";
      case "2": return "warning";
      case "1": return "info";
      default: return "info";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "6": return "รอกรอกรายละเอียด";
      case "5": return "ส่งซ่อม";
      case "4": return "เสร็จสิ้น";
      case "3": return "รออะไหล่";
      case "2": return "กำลังดำเนินการ";
      case "1": return "ยังไม่ได้ดำเนินการ";
      default: return "เจ้าหน้าที่ยังไม่ได้รับงาน";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-bold text-slate-800 m-0">ความหนาแน่นของงานที่เกิดขึ้น</h3>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 border-l border-slate-200 pl-4">
            <span>น้อย</span>
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-50 border border-slate-200"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-50"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-100"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-200"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-300"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-400"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-700"></div>
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-900"></div>
            </div>
            <span>มาก</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider">ดูตามหมวดหมู่:</span>
          <Dropdown
            value={selectedCategory}
            options={categories}
            onChange={(e) => setSelectedCategory(e.value)}
            className="w-full sm:w-48 border-slate-200 shadow-none text-xs h-9 flex items-center bg-white"
          />
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-5 overflow-x-auto">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height="2rem" width="100%" />
            ))}
          </div>
        ) : heatmapData.yLabels.length > 0 ? (
          <div className="min-w-[800px]">
            {/* X-Axis Labels (Hours) */}
            <div className="flex ml-32 mb-2">
              {heatmapData.hours.map((hour) => (
                <div key={hour} className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {hour}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div className="flex flex-col gap-1">
              {heatmapData.yLabels.map((label, rIdx) => (
                <div key={label} className="flex items-center gap-1 group">
                  <div className="w-32 text-right pr-3 text-[11px] font-bold text-slate-600 truncate" title={label}>
                    {label}
                  </div>
                  {heatmapData.matrix[rIdx].map((val, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={() => handleCellClick(label, heatmapData.hours[cIdx], val)}
                      className={`flex-1 h-8 rounded-sm transition-all duration-200 flex items-center justify-center 
                        ${getHeatmapColor(val)} 
                        ${val > 0 ? "cursor-pointer hover:ring-2 hover:ring-indigo-300 hover:z-10 shadow-sm" : "cursor-default"}`}
                      title={`${label} | ${heatmapData.hours[cIdx]} น. | ${val} งาน (คลิกเพื่อดูรายละเอียด)`}
                    >
                      {val > 0 && <span className="text-[10px] font-black">{val}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <i className="pi pi-th-large text-4xl opacity-20"></i>
            <span className="text-sm font-medium">ไม่พบข้อมูลความหนาแน่นในช่วงเวลานี้</span>
          </div>
        )}
      </div>

      {/* Task Details Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        position="right"
        onHide={() => setSidebarVisible(false)}
        className="border-l border-slate-200 shadow-2xl p-0"
        style={{ width: '95vw', maxWidth: '650px' }}
        header={(
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-indigo-700 m-0">{sidebarTitle}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">รายการงานที่พบ</p>
          </div>
        )}
      >
        <div className="flex flex-col gap-4 p-5 pt-2">
          {sidebarLoading ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} height="120px" className="rounded-xl" />)
          ) : sidebarTasks.length > 0 ? (
            sidebarTasks.map((task, idx) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${task.status === "3" ? "bg-emerald-500" : task.status === "2" ? "bg-amber-500" : "bg-indigo-500"}`}></div>

                <div className="pl-2">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Tag value={getStatusLabel(task.status)} severity={getStatusSeverity(task.status)} className="text-[9px] font-bold py-0.5 px-2" />
                      {task.intern_count > 0 && (
                        <Tag value={`นักศึกษาช่วยงาน ${task.intern_count} คน`} severity="warning" icon="pi pi-users" className="text-[9px] font-bold py-0.5 px-2" />
                      )}
                    </div>
                    <div className="inline-flex items-center gap-2 text-slate-500 rounded-md">

                      {/* ส่วนวันที่ */}
                      <div className="flex items-center gap-1.5">
                        <i className="pi pi-calendar text-[10px] text-slate-400"></i>
                        <span className="text-[10px] font-bold">
                          {/* แปลงจาก yyyy-mm-dd เป็น dd/mm/yyyy */}
                          {task.date_report ? task.date_report.split('-').reverse().join('/') : '-'}
                        </span>
                      </div>

                      {/* เส้นแบ่ง (Divider) บางๆ ดูมินิมอลกว่าการพิมพ์ตัว | */}
                      <div className="w-[1px] h-3 bg-slate-300"></div>

                      {/* ส่วนเวลา */}
                      <div className="flex items-center gap-1.5">
                        <i className="pi pi-clock text-[10px] text-slate-400"></i>
                        <span className="text-[10px] font-bold">
                          {task.time_report ? `${task.time_report.slice(0, 5)} น.` : '-'}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-sm font-bold text-slate-800 m-0 leading-snug group-hover:text-blue-600 transition-colors">
                      {task.deviceName}
                    </h4>

                    {task.problem && (
                      <div className="bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md inline-block">
                        <p className="text-[10px] font-bold m-0 flex items-center gap-1.5">
                          {task.problem}
                        </p>
                      </div>
                    )}
                  </div>


                  <p className="text-md text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    {task.report}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 shrink-0 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-500">
                        <i className="pi pi-building text-[11px]"></i>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">หน่วยงาน</span>
                        <span className="text-[11px] font-bold text-slate-700 truncate" title={task.depart_name}>{task.depart_name || "-"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 shrink-0 rounded-lg bg-orange-50/50 flex items-center justify-center text-orange-500">
                        <i className="pi pi-user text-[11px]"></i>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">เจ้าหน้าที่</span>
                        <span className="text-[11px] font-bold text-slate-700 truncate" title={task.staff_name}>{task.staff_name || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                <i className="pi pi-search text-2xl opacity-30"></i>
              </div>
              <span className="text-sm font-bold">ไม่พบรายละเอียดงานในหมวดหมู่นี้</span>
            </div>
          )}
        </div>
      </Sidebar>
    </div>
  );
};

export default ActivityHeatmap;

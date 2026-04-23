import React, { useState, useEffect, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import { Sidebar } from "primereact/sidebar";
import { Tag } from "primereact/tag";
import api from "../../../services/api";

const ActivityHeatmap = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState({ yLabels: [], hours: [], matrix: [] });
  const [selectedCategory, setSelectedCategory] = useState("device");

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
      case "3": return "success";
      case "2": return "warning";
      default: return "info";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "3": return "เสร็จสิ้น";
      case "2": return "กำลังดำเนินการ";
      default: return "รอดำเนินการ";
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

      {/* Footer Info */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <p className="text-[10px] text-slate-400 m-0 flex items-center gap-1">
          <i className="pi pi-info-circle text-[12px]"></i>
          ข้อมูลอ้างอิงจากตารางการแจ้งซ่อม (orderit.data_report) เท่านั้น
        </p>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heatmap Intensity Scale</span>
      </div>

      {/* Task Details Sidebar */}
      <Sidebar 
        visible={sidebarVisible} 
        position="right" 
        onHide={() => setSidebarVisible(false)}
        className="w-full md:w-[450px] lg:w-[500px] border-l border-slate-200 shadow-2xl p-0"
        header={(
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-indigo-700 m-0">{sidebarTitle}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">รายการภารกิจที่พบ</p>
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
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  task.status === "3" ? "bg-emerald-500" : task.status === "2" ? "bg-amber-500" : "bg-indigo-500"
                }`}></div>

                <div className="flex justify-between items-start mb-3 ml-2">
                  <div className="flex gap-2">
                    <Tag value={getStatusLabel(task.status)} severity={getStatusSeverity(task.status)} className="text-[9px] font-bold py-0.5 px-2" />
                    {task.intern_count > 0 && (
                      <Tag value={`นักศึกษาช่วยงาน ${task.intern_count} คน`} severity="warning" icon="pi pi-users" className="text-[9px] font-bold py-0.5 px-2" />
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-400">{task.time_report.slice(0, 5)} น.</span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 m-0 mb-1 ml-2 leading-snug">
                  {task.deviceName}
                </h4>
                <p className="text-xs text-slate-500 ml-2 mb-4 italic line-clamp-2">
                  {task.problem}
                </p>

                <div className="grid grid-cols-2 gap-2 ml-2 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center">
                      <i className="pi pi-building text-slate-400 text-[10px]"></i>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">หน่วยงาน</span>
                      <span className="text-[10px] font-bold text-slate-600 truncate w-32">{task.depart_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center">
                      <i className="pi pi-user text-slate-400 text-[10px]"></i>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">เจ้าหน้าที่</span>
                      <span className="text-[10px] font-bold text-slate-600 truncate w-32">{task.staff_name}</span>
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

import React, { useState, useEffect, useCallback } from "react";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Skeleton } from "primereact/skeleton";
import api from "../../../services/api";

const WorkloadChart = ({ globalFilter }) => {
  const [view, setView] = useState("gantt");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ ganttData: [], barData: { labels: [], datasets: [] } });
  const [groupingCategory, setGroupingCategory] = useState("workingList");
  const [localFilters, setLocalFilters] = useState({
    date: new Date(),
  });
  const [filterOptions, setFilterOptions] = useState({
    workingList: [],
    problemList: [],
    device: [],
    depart: [],
    staff: [],
  });

  const ganttHours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  const categories = [
    { label: "รูปแบบการทำงาน", value: "workingList" },
    { label: "รูปแบบ activity", value: "problemList" },
    { label: "อุปกรณ์", value: "device" },
    { label: "หน่วยงาน", value: "depart" },
    { label: "ร่วมงานกับเจ้าหน้าที่", value: "staff" },
  ];

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
      const params = {
        studentMode: globalFilter.person === "all" ? "all" : "individual",
        studentId: globalFilter.person !== "all" ? globalFilter.person : undefined,
        academicYear: globalFilter.year,
        term: globalFilter.term,
        university: globalFilter.university !== "all" ? globalFilter.university : undefined,
        groupingCategory: groupingCategory,
        // Global time range for Bar, local date for Gantt
        startDate: view === "bar" ? undefined : localFilters.date?.toISOString().split("T")[0],
        endDate: view === "bar" ? undefined : localFilters.date?.toISOString().split("T")[0],
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
  const displayYLabels = globalFilter.person === "all" ? yLabels : ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];

  return (
    <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
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
            <div className="flex flex-col gap-1.5 w-44">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">วันที่ (Timeline)</label>
              <Calendar
                value={localFilters.date}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, date: e.value }))}
                dateFormat="dd/mm/yy"
                className="w-full h-10"
                inputClassName="text-sm border-slate-200 bg-white rounded-lg shadow-sm"
              />
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
            <div className="flex w-full mb-2 ml-24 border-b border-slate-200 pb-2">
              {ganttHours.map((hour, i) => (
                <div key={i} className="flex-1 text-xs font-semibold text-slate-400 text-left -ml-3">
                  {hour}
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-3 relative mt-2 overflow-y-auto max-h-[400px] pr-2">
              <div className="absolute inset-0 ml-24 flex pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex-1 border-l border-slate-100 border-dashed h-full"></div>
                ))}
              </div>
              {displayYLabels.length > 0 ? displayYLabels.map((label, idx) => (
                <div key={idx} className="flex items-center h-10 relative">
                  <div className="w-24 text-[11px] font-medium text-slate-600 shrink-0 truncate pr-2" title={label}>{label}</div>
                  <div className="flex-1 h-full relative">
                    {data.ganttData
                      .filter((t) => t.yLabel === label)
                      .map((task) => {
                        const colors = [
                          '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4b99', '#14b8a6', '#f97316'
                        ];
                        const catIndex = [...new Set(data.ganttData.map(t => t.category))].indexOf(task.category);
                        const bgColor = colors[catIndex % colors.length];

                        return (
                          <div
                            key={task.id}
                            className="absolute h-8 top-1 rounded-md shadow-sm border px-2 flex items-center overflow-hidden cursor-pointer hover:brightness-95 transition-all text-white"
                            style={{ ...getGanttStyle(task.start, task.duration), backgroundColor: bgColor, borderColor: bgColor }}
                            title={`${task.title} [${task.category || 'ไม่ระบุ'}] (${task.start.toFixed(2)} - ${(task.start + task.duration).toFixed(2)})`}
                          >
                            <span className="text-[9px] font-semibold truncate leading-none">{task.title}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )) : (
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
    </div>
  );
};

export default WorkloadChart;


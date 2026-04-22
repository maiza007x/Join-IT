import React, { useState, useEffect, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import api from "../../../services/api";

const ActivityHeatmap = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ yLabels: [], hours: [], matrix: [] });
  const [category, setCategory] = useState("device");

  const categoryOptions = [
    { label: "อุปกรณ์", value: "device" },
    { label: "รูปแบบ activity", value: "problemList" },
    { label: "หน่วยงาน", value: "depart" },
    { label: "เจ้าหน้าที่รับงาน", value: "staff" },
    { label: "รูปแบบการทำงาน", value: "workingList" },
  ];

  const getHeatmapColor = (val) => {
    if (val === 0) return "bg-slate-50 border border-slate-100";
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getTimeRangeBounds(globalFilter.timeRange, globalFilter.customDates);

      const params = {
        studentMode: globalFilter.person === "all" ? "all" : "individual",
        studentId: globalFilter.person !== "all" ? globalFilter.person : undefined,
        academicYear: globalFilter.year,
        term: globalFilter.term,
        university: globalFilter.university !== "all" ? globalFilter.university : undefined,
        startDate,
        endDate,
        category
      };

      const response = await api.get("/tasks/heatmap-chart", { params });
      if (response.data.success) {
        setData(response.data.heatmapData);
      }
    } catch (err) {
      console.error("Failed to fetch heatmap data", err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-bold text-slate-800 m-0">ความหนาแน่นของงานที่เกิดขึ้นของเจ้าหน้าที่</h3>
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
        <Dropdown
          value={category}
          options={categoryOptions}
          onChange={(e) => setCategory(e.value)}
          className="w-44 border-slate-200 shadow-none text-xs h-8 flex items-center bg-white"
        />
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton height="2rem" width="100%" />
            <Skeleton height="10rem" width="100%" />
          </div>
        ) : data.yLabels?.length > 0 ? (
          <div className="min-w-[800px]">
            {/* Header: Hours */}
            <div className="flex ml-36 mb-3">
              {data.hours.map((hour, idx) => (
                <div key={idx} className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {hour}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div className="flex flex-col gap-1.5">
              {data.yLabels.map((label, yIdx) => (
                <div key={yIdx} className="flex items-center gap-2 group">
                  <div className="w-32 text-[11px] font-bold text-slate-600 truncate text-right pr-2" title={label}>
                    {label}
                  </div>
                  <div className="flex-1 flex gap-1.5 h-9">
                    {data.matrix[yIdx].map((value, xIdx) => (
                      <div
                        key={xIdx}
                        className={`flex-1 rounded-lg transition-all duration-300 flex items-center justify-center text-[10px] font-bold ${getHeatmapColor(value)} hover:scale-[1.05] hover:shadow-lg cursor-default`}
                        title={`${label} @ ${data.hours[xIdx]} | ${value} ครั้ง`}
                      >
                        {value > 0 ? value : ""}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <i className="pi pi-calendar-times text-3xl"></i>
            <span className="text-sm">ไม่มีข้อมูลความหนาแน่นในช่วงเวลาที่เลือก</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHeatmap;

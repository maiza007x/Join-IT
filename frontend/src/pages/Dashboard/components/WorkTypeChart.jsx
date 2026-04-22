import React, { useState, useEffect, useCallback } from "react";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import api from "../../../services/api";

const WorkTypeChart = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [category, setCategory] = useState("device");

  const donutConfig = {
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, color: "#64748b", padding: 20, font: { family: "inherit", size: 11 } },
      },
    },
    maintainAspectRatio: true,
    layout: { padding: 10 },
  };

  const categoryOptions = [
    { label: "อุปกรณ์", value: "device" },
    { label: "รูปแบบ activity", value: "problemList" },
    { label: "หน่วยงาน", value: "depart" },
    { label: "ร่วมงานกับเจ้าหน้าที่", value: "staff" },
    { label: "รูปแบบการทำงาน", value: "workingList" },
  ];

  // Helper to get date range from globalFilter
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

      const response = await api.get("/tasks/worktype-chart", { params });
      if (response.data.success) {
        setChartData(response.data.chartData);
      }
    } catch (err) {
      console.error("Failed to fetch work type data", err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0 shrink-0">สัดส่วนประเภทงาน</h3>
        <Dropdown
          value={category}
          options={categoryOptions}
          onChange={(e) => setCategory(e.value)}
          className="w-full sm:w-44 border-slate-200 shadow-none text-xs h-8 flex items-center bg-white"
        />
      </div>
      <div className="p-5 grow flex items-center justify-center min-h-[300px]">
        {loading ? (
          <Skeleton shape="circle" size="12rem" />
        ) : chartData.labels?.length > 0 ? (
          <Chart type="doughnut" data={chartData} options={donutConfig} className="w-full max-w-[400px]" />
        ) : (
          <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
            <i className="pi pi-inbox text-2xl"></i>
            <span>ไม่มีข้อมูลในช่วงเวลาที่เลือก</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTypeChart;

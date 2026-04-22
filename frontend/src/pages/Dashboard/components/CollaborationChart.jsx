import React, { useState, useEffect, useCallback } from "react";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import api from "../../../services/api";

const CollaborationChart = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  const horizontalBarConfig = {
    indexAxis: "y",
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#475569", font: { size: 12, weight: "500" } },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
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
        endDate
      };

      const response = await api.get("/tasks/collab-chart", { params });
      if (response.data.success) {
        setChartData(response.data.chartData);
      }
    } catch (err) {
      console.error("Failed to fetch collab data", err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0">การร่วมงานกับเจ้าหน้าที่</h3>
        <i className="pi pi-users text-slate-400"></i>
      </div>
      <div className="p-5 grow min-h-[300px]">
        {loading ? (
          <div className="flex flex-col gap-3">
             <Skeleton height="2rem" width="100%" />
             <Skeleton height="2rem" width="90%" />
             <Skeleton height="2rem" width="80%" />
             <Skeleton height="2rem" width="70%" />
          </div>
        ) : chartData.labels?.length > 0 ? (
          <Chart type="bar" data={chartData} options={horizontalBarConfig} className="h-[300px]" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <i className="pi pi-user-minus text-3xl"></i>
            <span className="text-sm">ไม่มีข้อมูลการร่วมงานในช่วงเวลาที่เลือก</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationChart;

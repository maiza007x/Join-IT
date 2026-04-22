import React, { useState, useEffect, useCallback } from "react";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import api from "../../../services/api";

const LearningKeywordsChart = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  const keywordChartOptions = {
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1e293b",
        bodyColor: "#475569",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context) {
            return ` เรียนรู้ไปแล้ว ${context.raw} ครั้ง`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#f8fafc", drawBorder: false },
        ticks: { color: "#94a3b8", font: { family: "inherit", size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#475569", font: { family: "inherit", weight: "700", size: 12 } },
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

      const response = await api.get("/tasks/keywords-chart", { params });
      if (response.data.success) {
        setChartData(response.data.chartData);
      }
    } catch (err) {
      console.error("Failed to fetch keywords data", err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0">สิ่งที่ได้เรียนรู้ (Keywords)</h3>
        <div className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
          Top Skills
        </div>
      </div>

      <div className="p-6 grow min-h-[300px] relative">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton height="2rem" width="100%" />
            <Skeleton height="2rem" width="90%" />
            <Skeleton height="2rem" width="85%" />
            <Skeleton height="2rem" width="70%" />
          </div>
        ) : chartData.labels?.length > 0 ? (
          <Chart type="bar" data={chartData} options={keywordChartOptions} className="h-[300px]" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <i className="pi pi-tags text-3xl"></i>
            <span className="text-sm">ไม่มีข้อมูลคีย์เวิร์ดในช่วงเวลาที่เลือก</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningKeywordsChart;

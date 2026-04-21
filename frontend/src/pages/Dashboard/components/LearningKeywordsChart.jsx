import React from "react";
import { Chart } from "primereact/chart";

const LearningKeywordsChart = ({ data }) => {
  const keywordChartOptions = {
    indexAxis: "y", // ทำให้กราฟเป็นแนวนอน
    plugins: {
      legend: { display: false }, // ซ่อน Legend เพราะเราใช้สีแยกแท่งแล้ว
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
    maintainAspectRatio: true,
    animation: { duration: 1500, easing: "easeOutQuart" },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0">สิ่งที่ได้เรียนรู้ (Keywords)</h3>
        <div className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
          Top Skills
        </div>
      </div>

      <div className="p-6 grow min-h-[250px] relative">
        <Chart type="bar" data={data} options={keywordChartOptions} />
      </div>
    </div>
  );
};

export default LearningKeywordsChart;

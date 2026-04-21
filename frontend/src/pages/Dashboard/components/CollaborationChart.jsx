import React from "react";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";

const CollaborationChart = ({ data, filter, onFilterChange, filterOptions }) => {
  const horizontalBarConfig = {
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "#f1f5f9", drawBorder: false }, ticks: { color: "#94a3b8" } },
      y: { grid: { display: false }, ticks: { color: "#475569", font: { family: "inherit", weight: "500" } } },
    },
    maintainAspectRatio: true,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0">เจ้าหน้าที่ที่ร่วมงานด้วย</h3>
        <Dropdown
          value={filter}
          options={filterOptions}
          onChange={(e) => onFilterChange(e.value)}
          className="w-32 border-slate-200 shadow-none text-xs h-8 flex items-center"
        />
      </div>
      <div className="p-5 grow min-h-[250px]">
        <Chart type="bar" data={data} options={horizontalBarConfig} />
      </div>
    </div>
  );
};

export default CollaborationChart;

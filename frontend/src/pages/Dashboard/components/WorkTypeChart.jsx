import React from "react";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";

const WorkTypeChart = ({ data, filter, onFilterChange, filterOptions }) => {
  const donutConfig = {
    plugins: {
      legend: {
        position: "right",
        labels: { usePointStyle: true, color: "#64748b", padding: 20, font: { family: "inherit", size: 12 } },
      },
    },
    maintainAspectRatio: true,
    layout: { padding: 10 },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0 shrink-0">สัดส่วนประเภทงาน</h3>
        <Dropdown
          value={filter}
          options={filterOptions}
          onChange={(e) => onFilterChange(e.value)}
          className="w-28 border-slate-200 shadow-none text-xs h-8 flex items-center"
        />
      </div>
      <div className="p-5 grow min-h-[300px] flex items-center justify-center">
        <Chart type="doughnut" data={data} options={donutConfig} />
      </div>
    </div>
  );
};

export default WorkTypeChart;

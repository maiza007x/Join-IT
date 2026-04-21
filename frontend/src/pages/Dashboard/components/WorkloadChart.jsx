import React, { useState } from "react";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";

const WorkloadChart = ({ barData, ganttData, filterOptions, filter, onFilterChange }) => {
  const [view, setView] = useState("gantt");

  const ganttHours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];

  const getGanttStyle = (start, duration) => {
    const totalHours = 9;
    const leftPercent = ((start - 8) / totalHours) * 100;
    const widthPercent = (duration / totalHours) * 100;
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const chartConfig = {
    plugins: {
      legend: {
        labels: { color: "#64748b", font: { family: "inherit", size: 12 } },
        position: "bottom",
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: "#94a3b8", font: { family: "inherit", size: 11 } } },
      y: { stacked: true, grid: { color: "#f1f5f9" }, border: { dash: [4, 4] }, ticks: { color: "#94a3b8", font: { family: "inherit", size: 11 } } },
    },
    maintainAspectRatio: true,
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800 m-0 shrink-0">ปริมาณภาระงานรายวัน</h3>
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
          <Dropdown
            value={filter}
            options={filterOptions}
            onChange={(e) => onFilterChange(e.value)}
            className="w-28 border-slate-200 shadow-none text-xs h-8 flex items-center"
          />
        </div>

      </div>

      <div className="p-5 grow min-h-[300px] relative">
        {view === "bar" ? (
          <Chart type="bar" data={barData} options={chartConfig} />
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="flex w-full mb-2 ml-16 border-b border-slate-200 pb-2">
              {ganttHours.map((hour, i) => (
                <div key={i} className="flex-1 text-xs font-semibold text-slate-400 text-left -ml-3">
                  {hour}
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-3 relative mt-2">
              <div className="absolute inset-0 ml-16 flex pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex-1 border-l border-slate-100 border-dashed h-full"></div>
                ))}
              </div>
              {days.map((day, dIdx) => (
                <div key={dIdx} className="flex items-center h-10 relative">
                  <div className="w-16 text-sm font-medium text-slate-600 shrink-0">{day}</div>
                  <div className="flex-1 h-full relative">
                    {ganttData
                      .filter((t) => t.day === day)
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`absolute h-8 top-1 rounded-md shadow-sm border px-2 flex items-center overflow-hidden cursor-pointer hover:brightness-95 transition-all
                            ${task.type === "join" ? "bg-indigo-500 border-indigo-600 text-white" : "bg-emerald-500 border-emerald-600 text-white"}`}
                          style={getGanttStyle(task.start, task.duration)}
                          title={`${task.title} (${task.start.toFixed(2)} - ${(task.start + task.duration).toFixed(2)})`}
                        >
                          <span className="text-[10px] font-semibold truncate leading-none">{task.title}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
                <span className="text-xs text-slate-500 font-medium">งานที่ช่วยพี่ (Join)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                <span className="text-xs text-slate-500 font-medium">งานที่ทำเอง (Self)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkloadChart;

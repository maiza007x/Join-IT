import React from "react";
import { Dropdown } from "primereact/dropdown";

const ActivityHeatmap = ({ data, filter, onFilterChange, filterOptions }) => {
  const heatmapDays = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
  const heatmapHours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  const getHeatmapColor = (val) => {
    if (val === 0) return "bg-slate-50 border border-slate-100";
    if (val <= 2) return "bg-indigo-200";
    if (val <= 4) return "bg-indigo-400";
    return "bg-indigo-600";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-bold text-slate-800 m-0">ความหนาแน่นของงานตามช่วงเวลา</h3>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 border-l border-slate-200 pl-4">
            <span>น้อย</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-50 border border-slate-200"></div>
              <div className="w-3 h-3 rounded-sm bg-indigo-400"></div>
              <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
            </div>
            <span>มาก</span>
          </div>
        </div>
        <Dropdown
          value={filter}
          options={filterOptions}
          onChange={(e) => onFilterChange(e.value)}
          className="w-36 border-slate-200 shadow-none text-xs h-8 flex items-center"
        />
      </div>

      <div className="p-6 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex ml-16 mb-2">
            {heatmapHours.map((h, i) => (
              <div key={i} className="flex-1 text-center text-xs font-semibold text-slate-500">
                {h}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {data.map((row, rIdx) => (
              <div key={rIdx} className="flex items-center gap-2 h-10">
                <div className="w-14 text-right pr-2 text-sm font-medium text-slate-600">{heatmapDays[rIdx]}</div>
                <div className="flex-1 flex gap-2 h-full">
                  {row.map((val, cIdx) => (
                    <div
                      key={cIdx}
                      className={`flex-1 rounded-md transition-opacity hover:opacity-75 cursor-pointer ${getHeatmapColor(val)}`}
                      title={`${heatmapDays[rIdx]} ${heatmapHours[cIdx]} น. | ${val} ภารกิจ`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;

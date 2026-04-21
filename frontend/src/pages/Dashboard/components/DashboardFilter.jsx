import React from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";

const DashboardFilter = ({ filters, options, onChange, onApply, loading }) => {
  return (
    <div className="xl:sticky xl:top-22">
      <div className="w-full flex items-center bg-white px-5 py-3 rounded-xl shadow-sm border border-white gap-4 mb-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <i className="pi pi-book text-white text-lg"></i>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0 leading-tight">Intern Dashboard</h1>
          <p className="text-xs font-medium text-slate-500 m-0">แดชบอร์ดสรุปผลการปฏิบัติงาน</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm ">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 m-0">
            <i className="pi pi-filter text-indigo-500"></i> ตัวกรองข้อมูลหลัก
          </h2>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ปีการศึกษา</label>
            <Dropdown
              value={filters.year}
              options={options.year}
              onChange={(e) => onChange("year", e.value)}
              className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ภาคเรียน</label>
            <Dropdown
              value={filters.term}
              options={options.term}
              onChange={(e) => onChange("term", e.value)}
              className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">สถาบัน</label>
            <Dropdown
              value={filters.university}
              options={options.university}
              onChange={(e) => onChange("university", e.value)}
              className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">เป้าหมายข้อมูล (บุคคล)</label>
            <Dropdown
              value={filters.person}
              options={options.person}
              onChange={(e) => onChange("person", e.value)}
              className="w-full border-indigo-200 shadow-none text-sm h-10 flex items-center bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-lg transition-colors font-medium"
              panelClassName="text-sm"
            />
          </div>

          <div className="w-full h-px bg-slate-100 my-1"></div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ช่วงเวลา</label>
            <Dropdown
              value={filters.timeRange}
              options={options.timeRange}
              onChange={(e) => onChange("timeRange", e.value)}
              className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors"
            />
          </div>

          {filters.timeRange === "custom" && (
            <div className="flex flex-col gap-1.5 animate-fadein">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ระบุวันที่</label>
              <Calendar
                value={filters.customDates}
                onChange={(e) => onChange("customDates", e.value)}
                selectionMode="range"
                readOnlyInput
                placeholder="เริ่ม - สิ้นสุด"
                className="w-full h-10"
                inputClassName="text-sm border-slate-200 bg-white hover:border-indigo-300 focus:border-indigo-500 rounded-lg transition-colors"
              />
            </div>
          )}

          <div className="mt-2 flex flex-col gap-2">
            <Button
              label="อัปเดตข้อมูล"
              icon="pi pi-search"
              loading={loading}
              onClick={onApply}
              className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white border-none text-sm py-2.5 rounded-lg font-bold shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            />
            <Button
              label="รีเซ็ตกลับค่าเริ่มต้น"
              icon="pi pi-refresh"
              className="w-full justify-center text-slate-500 bg-transparent hover:bg-slate-100 border-none text-xs py-2.5 rounded-lg font-bold transition-all focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilter;

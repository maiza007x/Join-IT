import React from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const StaffTasksSection = ({
    tasks,
    loading,
    actionLoading,
    filters,
    setFilters,
    reporterFilterTemplate,
    fetchTasks,
    confirmJoin,
    confirmLeave
}) => {
    const myContributedTasks = tasks.filter((t) => t.isContributedByMe).length;

    const timeTemplate = (rowData) => {
        if (!rowData.time_report) return "-";
        return (
            <span className="font-black text-slate-700">
                {rowData.time_report.substring(0, 5)} น.
            </span>
        );
    };

    const internTemplate = (rowData) => (
        <div className="flex flex-wrap gap-1">
            {rowData.interns && rowData.interns.length > 0 ? (
                rowData.interns.map((name, index) => (
                    <Tag
                        key={index}
                        value={name}
                        rounded
                        className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-bold"
                    />
                ))
            ) : (
                <span className="text-slate-300 text-[10px] italic">
                    ยังไม่มีคนช่วย
                </span>
            )}
        </div>
    );

    const actionTemplate = (rowData) => {
        const isJoined = rowData.isContributedByMe;
        const isLoading = actionLoading === rowData.id;
        return (
            <Button
                label={isJoined ? "ยกเลิก" : "ผูกงาน"}
                icon={isJoined ? "pi pi-times" : "pi pi-plus"}
                rounded
                severity={isJoined ? "danger" : "info"}
                loading={isLoading}
                className={`px-3 py-1.5 text-[10px] font-bold border-none transition-all ${isJoined ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100" : "bg-slate-900 hover:bg-slate-700 shadow-lg shadow-slate-200"}`}
                onClick={() =>
                    isJoined ? confirmLeave(rowData.id) : confirmJoin(rowData.id)
                }
            />
        );
    };

    return (
        <div className="flex flex-col gap-5">
            {/* 📊 Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <i className="pi pi-briefcase text-3xl text-blue-500 bg-blue-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            งานทั้งหมดในระบบ
                        </span>
                        <h2 className="text-3xl font-black text-blue-950 mt-1">
                            {tasks.length}{" "}
                            <span className="text-sm font-medium text-slate-400">
                                รายการ
                            </span>
                        </h2>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-green-500">
                    <i className="pi pi-users text-3xl text-green-500 bg-green-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            คุณเข้าร่วม
                        </span>
                        <h2 className="text-3xl font-black text-green-950 mt-1">
                            {myContributedTasks}{" "}
                            <span className="text-sm font-medium text-slate-400">
                                รายการ
                            </span>
                        </h2>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-orange-400">
                    <i className="pi pi-user text-3xl text-orange-400 bg-orange-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            ยังไม่มีคนช่วย
                        </span>
                        <h2 className="text-3xl font-black text-orange-950 mt-1">
                            {
                                tasks.filter((t) => !t.interns || t.interns.length === 0)
                                    .length
                            }{" "}
                            <span className="text-sm font-medium text-slate-400">
                                รายการ
                            </span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
                <div className="p-7 flex items-center justify-between bg-slate-900 border-b border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                        <div>
                            <h3 className="m-0 font-black text-white text-xl tracking-tight">
                                รายการงานวันนี้
                            </h3>
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">
                                Update: {new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })} น.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            icon="pi pi-refresh"
                            className="p-button-rounded p-button-text text-white hover:bg-white/10"
                            tooltip="รีเฟรชงานล่าสุด"
                            onClick={() => fetchTasks()}
                            loading={loading}
                        />
                    </div>
                </div>

                <div className="p-4">
                    <div className="hidden md:block">
                        <DataTable
                            value={tasks}
                            loading={loading}
                            paginator
                            rows={10}
                            scrollable
                            scrollDirection="horizontal"
                            stripedRows
                            sortField="id"
                            sortOrder={-1}
                            removableSort
                            emptyMessage="ไม่พบรายการงานที่ตรงตามเงื่อนไข"
                            className="p-datatable-sm custom-luxury-table"
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                            currentPageReportTemplate="{first}-{last} of {totalRecords}"
                            filters={filters}
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column
                                field="id"
                                header="#"
                                headerStyle={{ width: "4rem" }}
                                bodyStyle={{
                                    fontWeight: "black",
                                    color: "#cbd5e1",
                                    fontSize: "13px",
                                }}
                                sortable
                            />
                            <Column
                                field="time_report"
                                header="เวลาแจ้ง"
                                body={timeTemplate}
                                style={{ width: "8rem" }}
                                sortable
                            />
                            <Column
                                field="deviceName"
                                header="อุปกรณ์"
                                body={(row) => (
                                    <div className="py-1">
                                        <div className="font-bold text-slate-800 text-base">
                                            {row.deviceName}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <i className="pi pi-map-marker text-blue-400 text-[10px]"></i>
                                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                {row.department_name}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                style={{ width: "17rem" }}
                                sortable
                            />
                            <Column
                                field="report"
                                header="รายละเอียดปัญหา"
                                className="text-slate-600 leading-relaxed"
                                sortable
                                style={{ width: "20rem" }}
                            />
                            <Column
                                field="username"
                                header="ผู้แจ้ง"
                                body={(row) => (
                                    <span className="text-slate-500 font-semibold italic">
                                        @{row.username}
                                    </span>
                                )}
                                style={{ width: "13rem" }}
                                sortable
                                filter
                                filterElement={reporterFilterTemplate}
                                showFilterMatchModes={false}
                            />
                            <Column
                                header="ผู้ช่วยเหลือ"
                                body={internTemplate}
                                style={{ width: "14rem" }}
                            />
                            <Column
                                header="จัดการ"
                                body={actionTemplate}
                                style={{ textAlign: "center", width: "13rem" }}
                            />
                        </DataTable>
                    </div>
                    {/* Mobile Cards (Tasks) */}
                    <div className="md:hidden flex flex-col gap-4">
                        {tasks.length > 0 ? (
                            tasks.map((row, i) => {
                                const isJoined = row.isContributedByMe;
                                const isLoading = actionLoading === row.id;
                                return (
                                    <div
                                        key={i}
                                        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3 relative"
                                    >
                                        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                                            <div className="flex items-center gap-2">
                                                <i className="pi pi-clock text-slate-400 text-xs"></i>
                                                <span className="font-black text-slate-700 text-sm">
                                                    {row.time_report
                                                        ? row.time_report.substring(0, 5) + " น."
                                                        : "-"}
                                                </span>
                                            </div>
                                            <span className="text-slate-500 font-semibold italic text-xs bg-slate-50 px-2 py-1 rounded-md">
                                                @{row.username}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <h4 className="font-bold text-slate-800 text-base m-0 leading-tight">
                                                {row.deviceName}
                                            </h4>
                                            <div className="flex items-center gap-1.5">
                                                <i className="pi pi-map-marker text-blue-400 text-[10px]"></i>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {row.department_name}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {row.report}
                                        </p>

                                        <div className="flex flex-col gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                ผู้ช่วยเหลือ
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {row.interns && row.interns.length > 0 ? (
                                                    row.interns.map((name, index) => (
                                                        <Tag
                                                            key={index}
                                                            value={name}
                                                            rounded
                                                            className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-bold"
                                                        />
                                                    ))
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] italic">
                                                        ยังไม่มีคนช่วย
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            label={isJoined ? "ยกเลิก" : "ผูกงาน"}
                                            icon={isJoined ? "pi pi-times" : "pi pi-plus"}
                                            loading={isLoading}
                                            className={`w-full h-10 p-button-sm border-none rounded-xl text-xs font-bold mt-2 shadow-md transition-all ${isJoined ? "bg-red-500 hover:bg-red-600 shadow-red-100" : "bg-slate-900 hover:bg-slate-700 shadow-slate-200"}`}
                                            onClick={() =>
                                                isJoined ? confirmLeave(row.id) : confirmJoin(row.id)
                                            }
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium pr-2">
                                ไม่พบรายการงานที่ตรงตามเงื่อนไข
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffTasksSection;

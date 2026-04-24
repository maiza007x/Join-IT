import React from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const InternTasksSection = ({
    internTasks,
    loading,
    actionLoading,
    user,
    setCreateModalVisible,
    confirmAcceptIntern,
    confirmLeaveIntern,
    openEditModal,
    confirmCloseMain
}) => {
    const timeTemplate = (rowData) => {
        if (!rowData.time_report) return "-";
        return (
            <span className="font-black text-slate-700">
                {rowData.time_report.substring(0, 5)} น.
            </span>
        );
    };

    const internTakerTemplate = (rowData) => (
        <div className="flex flex-wrap gap-1">
            {rowData.interns && rowData.interns.length > 0 ? (
                rowData.interns.map((name, index) => (
                    <Tag
                        key={index}
                        value={name}
                        rounded
                        className="px-2.5 py-1 text-[10px] bg-orange-50 text-orange-600 border border-orange-100 font-bold"
                    />
                ))
            ) : (
                <span className="text-slate-300 text-[10px] italic">รอผู้รับงาน</span>
            )}
        </div>
    );

    const internActionTemplate = (rowData) => {
        const isTaker = rowData.isContributedByMe;
        const isClosed = rowData.isClosed;
        const isOwner = rowData.created_by === (user?.full_name || user?.username);
        const isLoading = actionLoading === `intern-${rowData.id}` || actionLoading === `intern-close-${rowData.id}`;

        return (
            <div className="flex flex-wrap gap-2 justify-center items-center">
                {isClosed ? (
                    <Tag value="ปิดงานแล้ว" severity="danger" rounded className="px-3 py-1.5 text-[10px] bg-red-100 text-red-600 border-none font-bold" />
                ) : (
                    <Button
                        label={isTaker ? "รับงานแล้ว" : "รับงาน"}
                        icon={isTaker ? "pi pi-check-circle" : "pi pi-check"}
                        rounded
                        severity={isTaker ? "success" : "info"}
                        loading={actionLoading === `intern-${rowData.id}`}
                        className={`px-3 py-1.5 text-[10px] font-bold border-none transition-all ${isTaker ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"}`}
                        onClick={() =>
                            isTaker
                                ? confirmLeaveIntern(rowData.id)
                                : confirmAcceptIntern(rowData.id)
                        }
                    />
                )}

                {isOwner && !isClosed && (
                    <div className="flex gap-1 ml-1 border-l border-slate-200 pl-2">
                        <Button
                            icon="pi pi-pencil"
                            rounded
                            severity="warning"
                            tooltip="แก้ไขงาน"
                            tooltipOptions={{ position: 'top' }}
                            className="w-7 h-7 p-0 bg-yellow-500 hover:bg-yellow-600 border-none shadow-md shadow-yellow-100"
                            onClick={() => openEditModal(rowData)}
                        />
                        <Button
                            icon="pi pi-power-off"
                            rounded
                            severity="danger"
                            tooltip="ปิดงาน (เสร็จสิ้น)"
                            tooltipOptions={{ position: 'top' }}
                            className="w-7 h-7 p-0 bg-red-500 hover:bg-red-600 border-none shadow-md shadow-red-100"
                            onClick={() => confirmCloseMain(rowData.id)}
                            loading={actionLoading === `intern-close-${rowData.id}`}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-8 bg-white rounded-3xl shadow-lg shadow-slate-200/50 overflow-hidden border border-slate-100 mb-8">
            <div className="bg-gradient-to-r from-orange-50 to-white p-5 md:p-6 border-b border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
                        <i className="pi pi-users text-xl"></i>
                    </div>
                    <div>
                        <h3 className="m-0 font-black text-slate-800 text-xl tracking-tight">
                            รายการภารกิจมอบหมายพิเศษ (โดยนักศึกษา)
                        </h3>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">
                            งานส่งต่อและช่วยเหลือกันภายในทีม
                        </p>
                    </div>
                </div>
                <Button
                    label="สร้างงาน (นักศึกษา)"
                    icon="pi pi-plus"
                    className="bg-orange-500 hover:bg-orange-600 border-none font-bold rounded-xl shadow-md shadow-orange-200 px-4 py-2 text-sm text-white transition-all hover:scale-105"
                    onClick={() => setCreateModalVisible(true)}
                />
            </div>

            <div className="p-4 md:p-6 bg-slate-50">
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <DataTable
                        value={internTasks}
                        loading={loading}
                        paginator
                        rows={10}
                        stripedRows
                        sortField="id"
                        sortOrder={-1}
                        emptyMessage="ไม่พบรายการงานมอบหมายจากเพื่อน"
                        className="p-datatable-sm custom-orange-table"
                        rowHover
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                        currentPageReportTemplate="{first}-{last} of {totalRecords}"
                    >
                        <Column
                            field="id"
                            header="#"
                            headerStyle={{ width: "4rem", backgroundColor: '#fff7ed', color: '#ea580c' }}
                            bodyStyle={{ fontWeight: "black", color: "#fdba74", fontSize: "13px" }}
                            sortable
                        />
                        <Column
                            field="time_report"
                            header="เวลาแจ้ง"
                            body={timeTemplate}
                            style={{ width: "8rem" }}
                            headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                            sortable
                        />
                        <Column
                            field="deviceName"
                            header="งาน / อุปกรณ์"
                            body={(row) => (
                                <div className="py-1">
                                    <div className="font-bold text-slate-800 text-base">{row.deviceName}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <i className="pi pi-map-marker text-orange-400 text-[10px]"></i>
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{row.department_name || row.department}</span>
                                    </div>
                                </div>
                            )}
                            style={{ width: "17rem" }}
                            headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                            sortable
                        />
                        <Column
                            field="report"
                            header="รายละเอียดงาน"
                            className="text-slate-600 leading-relaxed"
                            sortable
                            headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                            style={{ width: "20rem" }}
                        />
                        <Column
                            field="created_by"
                            header="สร้างโดย"
                            body={(row) => (
                                <span className="text-slate-500 font-semibold italic">
                                    @{row.created_by}
                                </span>
                            )}
                            style={{ width: "13rem" }}
                            headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                            sortable
                        />
                        <Column
                            header="สมาชิกร่วมงาน"
                            body={internTakerTemplate}
                            style={{ width: "14rem" }}
                            headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                        />
                        <Column
                            header="จัดการ"
                            body={internActionTemplate}
                            style={{ textAlign: "center", width: "13rem" }}
                            headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                        />
                    </DataTable>
                </div>

                {/* Mobile Cards (Intern Tasks) */}
                <div className="md:hidden flex flex-col gap-4">
                    {internTasks.length > 0 ? (
                        internTasks.map((row, i) => {
                            const isTaker = row.isContributedByMe;
                            const isClosed = row.isClosed;
                            const isOwner = row.created_by === (user?.full_name || user?.username);
                            const isLoading = actionLoading === `intern-${row.id}` || actionLoading === `intern-close-${row.id}`;
                            return (
                                <div key={i} className={`bg-white border ${isClosed ? 'border-red-100 bg-red-50/10' : 'border-orange-100'} rounded-2xl p-5 shadow-sm flex flex-col gap-3 relative`}>
                                    {isClosed && (
                                        <div className="absolute top-4 right-4 z-10 opacity-20">
                                            <i className="pi pi-lock text-5xl text-red-500"></i>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-3 relative z-20">
                                        <div className="flex items-center gap-2">
                                            <i className="pi pi-clock text-slate-400 text-xs"></i>
                                            <span className="font-black text-slate-700 text-sm">
                                                {row.time_report ? row.time_report.substring(0, 5) + " น." : "-"}
                                            </span>
                                        </div>
                                        <span className="text-orange-500 font-semibold italic text-xs bg-orange-50 px-2 py-1 rounded-md">
                                            @{row.created_by}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 relative z-20">
                                        <h4 className="font-bold text-slate-800 text-base m-0 leading-tight">
                                            {row.deviceName}
                                        </h4>
                                        <div className="flex items-center gap-1.5">
                                            <i className="pi pi-map-marker text-orange-400 text-[10px]"></i>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {row.department_name || row.department}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 relative z-20">
                                        {row.report}
                                    </p>

                                    <div className="flex flex-col gap-2 mt-1 relative z-20">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            ผู้รับงาน
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {row.interns && row.interns.length > 0 ? (
                                                row.interns.map((name, index) => (
                                                    <Tag key={index} value={name} rounded className="px-2.5 py-1 text-[10px] bg-orange-50 text-orange-600 border border-orange-100 font-bold" />
                                                ))
                                            ) : (
                                                <span className="text-slate-300 text-[10px] italic">รอผู้รับงาน</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-2 relative z-20">
                                        {isClosed ? (
                                            <div className="w-full text-center py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs border border-red-100">
                                                <i className="pi pi-lock mr-2 text-[10px]"></i> ปิดงานแล้ว
                                            </div>
                                        ) : (
                                            <Button
                                                label={isTaker ? "รับงานแล้ว" : "รับงาน"}
                                                icon={isTaker ? "pi pi-check-circle" : "pi pi-check"}
                                                loading={actionLoading === `intern-${row.id}`}
                                                className={`w-full h-10 p-button-sm border-none rounded-xl text-xs font-bold shadow-md transition-all ${isTaker ? "bg-green-500 hover:bg-green-600 shadow-green-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"}`}
                                                onClick={() => isTaker ? confirmLeaveIntern(row.id) : confirmAcceptIntern(row.id)}
                                            />
                                        )}
                                        {isOwner && !isClosed && (
                                            <div className="flex gap-2">
                                                <Button
                                                    label="แก้ไข"
                                                    icon="pi pi-pencil"
                                                    className="flex-1 h-10 p-button-sm bg-yellow-500 hover:bg-yellow-600 border-none rounded-xl text-xs font-bold shadow-md shadow-yellow-100"
                                                    onClick={() => openEditModal(row)}
                                                />
                                                <Button
                                                    label="ปิดงาน"
                                                    icon="pi pi-power-off"
                                                    loading={actionLoading === `intern-close-${row.id}`}
                                                    className="flex-1 h-10 p-button-sm bg-red-500 hover:bg-red-600 border-none rounded-xl text-xs font-bold shadow-md shadow-red-100"
                                                    onClick={() => confirmCloseMain(row.id)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium pr-2">
                            ไม่พบรายการงานมอบหมายจากเพื่อน
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InternTasksSection;

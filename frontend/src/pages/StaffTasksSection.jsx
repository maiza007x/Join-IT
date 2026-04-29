import React, { useState } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import api from "../services/api";

const StaffTasksSection = ({
    tasks,
    loading,
    actionLoading,
    filters,
    setFilters,
    reporterFilterTemplate,
    fetchTasks,
    confirmJoin,
    confirmLeave,
    highlightTaskId
}) => {
    const myContributedTasks = tasks.filter((t) => t.isContributedByMe).length;
    const [detailDialogVisible, setDetailDialogVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const getPriorityText = (p) => {
        if (p === 1 || p === '1') return 'งานประจำวัน';
        if (p === 2 || p === '2') return 'ต่ำ';
        if (p === 3 || p === '3') return 'ปานกลาง';
        if (p === 4 || p === '4') return 'เร่งด่วน';
        return p || '-';
    };

    const getCloseTimeText = (t) => {
        if (!t || t.startsWith('00:00') || t === '00:000') return '-';
        return t.substring(0, 5);
    };

    const showDetailDialog = async (task) => {
        setSelectedTask(null);
        setDetailLoading(true);
        setDetailDialogVisible(true);
        try {
            const res = await api.get(`/tasks/staff-detail/${task.id}`);
            if (res.data && res.data.success) {
                setSelectedTask(res.data.data);
            } else {
                setSelectedTask(task);
            }
        } catch (err) {
            console.error("Error fetching staff task detail:", err);
            setSelectedTask(task);
        } finally {
            setDetailLoading(false);
        }
    };

    const processedTasks = React.useMemo(() => {
        return tasks.map((t) => ({
            ...t,
            interns_str: t.interns && t.interns.length > 0 ? t.interns.join(", ") : "",
        }));
    }, [tasks]);

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
            <div className="flex gap-2 items-center justify-center">
                <Button
                    label="ดูรายละเอียด"
                    icon="pi pi-eye"
                    rounded
                    className="px-3 py-1.5 text-[10px] font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                    onClick={() => showDetailDialog(rowData)}
                />
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
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-5">
            {/* 📊 Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-blue-500">
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-green-500">
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-orange-400">
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-50 overflow-hidden">
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
                            value={processedTasks}
                            loading={loading}
                            rowClassName={(rowData) => ({
                                'bg-blue-500/10 border-l-4 border-blue-500 animate-pulse font-bold shadow-inner': rowData.id === highlightTaskId
                            })}
                            paginator
                            rows={10}
                            scrollable
                            rowsPerPageOptions={[10, 25, 50]}
                            stripedRows
                            sortField="id"
                            sortOrder={-1}
                            removableSort
                            emptyMessage="ไม่พบรายการงานที่ตรงตามเงื่อนไข"
                            className="p-datatable-sm custom-luxury-table"
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
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
                                        {row.username ? `@${row.username}` : "-"}
                                    </span>
                                )}
                                style={{ width: "13rem" }}
                                sortable
                                filter
                                filterElement={reporterFilterTemplate}
                                showFilterMatchModes={false}
                            />
                            <Column
                                field="interns_str"
                                header="ผู้ช่วยเหลือ"
                                body={internTemplate}
                                style={{ width: "14rem" }}
                                sortable
                            />
                            <Column
                                field="isContributedByMe"
                                header="จัดการ"
                                body={actionTemplate}
                                style={{ textAlign: "center", width: "13rem" }}
                                sortable
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
                                        className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 relative transition-all duration-500 ${row.id === highlightTaskId
                                                ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-100 animate-pulse'
                                                : 'border-slate-100 shadow-sm'
                                            }`}
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

                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                label="ดูรายละเอียด"
                                                icon="pi pi-eye"
                                                className="flex-1 h-10 p-button-sm border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                                                onClick={() => showDetailDialog(row)}
                                            />
                                            <Button
                                                label={isJoined ? "ยกเลิก" : "ผูกงาน"}
                                                icon={isJoined ? "pi pi-times" : "pi pi-plus"}
                                                loading={isLoading}
                                                className={`flex-1 h-10 p-button-sm border-none rounded-xl text-xs font-bold shadow-md transition-all ${isJoined ? "bg-red-500 hover:bg-red-600 shadow-red-100" : "bg-slate-900 hover:bg-slate-700 shadow-slate-200"}`}
                                                onClick={() =>
                                                    isJoined ? confirmLeave(row.id) : confirmJoin(row.id)
                                                }
                                            />
                                        </div>
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

                {/* Premium Task Detail Dialog */}
                <Dialog
                    header={
                        <div className="flex justify-between items-center w-full pr-8 font-kanit">
                            <span className="text-lg font-bold text-slate-800">รายละเอียดงาน</span>
                        </div>
                    }
                    visible={detailDialogVisible}
                    style={{ width: '95%', maxWidth: '650px' }}
                    onHide={() => setDetailDialogVisible(false)}
                    className="rounded-xl overflow-hidden shadow-lg"
                    draggable={false}
                    blockScroll
                >
                    {detailLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 font-kanit">
                            <i className="pi pi-spin pi-spinner text-blue-600 text-3xl"></i>
                            <span className="text-slate-400 font-bold text-xs animate-pulse uppercase">กำลังดึงข้อมูลเชิงลึก...</span>
                        </div>
                    ) : selectedTask && (
                        <div className="flex flex-col gap-4 p-2 font-kanit text-slate-700 text-sm leading-relaxed">

                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">หมายเลขงาน</label>
                                    <InputText value={selectedTask.id || ''} disabled className="p-inputtext-sm bg-slate-100 font-bold text-slate-800 border border-slate-200 p-2 rounded" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">วันที่แจ้ง</label>
                                    <InputText value={selectedTask.date_report ? new Date(selectedTask.date_report).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">วันที่ปิดงาน</label>
                                    <InputText value={selectedTask.close_time ? new Date(selectedTask.close_time).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">เวลาแจ้ง</label>
                                    <InputText value={selectedTask.time_report ? selectedTask.time_report.substring(0, 5) : '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">เวลารับงาน</label>
                                    <InputText value={selectedTask.take ? selectedTask.take.substring(0, 5) : '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">เวลาปิดงาน (ถ้ามี)</label>
                                    <InputText value={getCloseTimeText(selectedTask.close_date)} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">ประเภทงาน</label>
                                    <InputText value={selectedTask.device || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">ระดับความเร่งด่วน</label>
                                    <InputText value={getPriorityText(selectedTask.priority)} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">ผู้แจ้ง</label>
                                    <InputText value={selectedTask.reporter || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">หน่วยงาน</label>
                                    <InputText value={selectedTask.department_name || selectedTask.department || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">เบอร์ติดต่อกลับ</label>
                                    <InputText value={selectedTask.tel || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">อุปกรณ์</label>
                                    <InputText value={selectedTask.deviceName || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">หมายเลขครุภัณฑ์ (ถ้ามี)</label>
                                    <InputText value={selectedTask.number_device || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">หมายเลข IP address</label>
                                    <InputText value={selectedTask.ip_address || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded font-mono text-slate-700" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="font-medium text-xs text-slate-700 mb-1">อาคารที่ได้รับแจ้ง</label>
                                <InputText value={selectedTask.report || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">รูปแบบการทำงาน</label>
                                    <InputText value={selectedTask.work_type || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">หมายเลขใบเบิก</label>
                                    <InputText value={selectedTask.withdraw || '-'} disabled className="p-inputtext-sm bg-slate-100 border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="font-medium text-xs text-slate-700 mb-1">รายละเอียด</label>
                                <InputTextarea value={selectedTask.description || '-'} disabled autoResize rows={3} className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                            </div>

                            <div className="flex flex-col">
                                <label className="font-medium text-xs text-slate-700 mb-1">หมายเหตุ</label>
                                <InputText value={selectedTask.note || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">ผู้คีย์งาน</label>
                                    <InputText value={selectedTask.create_by || '-'} disabled className="p-inputtext-sm bg-slate-100 border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-xs text-slate-700 mb-1">ซ่อมครั้งที่</label>
                                    <InputText value={selectedTask.repair_count || '1'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                </div>
                            </div>

                            {/* Section: งานคุณภาพ */}
                            <div className="mt-2 border-t pt-3 border-slate-200">
                                <span className="text-base font-bold text-slate-800 block mb-3">งานคุณภาพ</span>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col">
                                        <label className="font-medium text-xs text-slate-700 mb-1">ปัญหาอยู่ใน SLA หรือไม่</label>
                                        <InputText value={selectedTask.sla || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="font-medium text-xs text-slate-700 mb-1">เป็นตัวชี้วัดหรือไม่</label>
                                        <InputText value={selectedTask.kpi || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="font-medium text-xs text-slate-700 mb-1">Activity Report</label>
                                        <InputText value={selectedTask.problem || '-'} disabled className="p-inputtext-sm bg-white border border-slate-200 p-2 rounded text-slate-700" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    label="ปิดหน้าต่าง"
                                    icon="pi pi-times"
                                    className="p-button-text text-slate-600 p-button-sm font-bold"
                                    onClick={() => setDetailDialogVisible(false)}
                                />
                            </div>

                        </div>
                    )}
                </Dialog>
            </div>
        </div>
    );
};

export default StaffTasksSection;

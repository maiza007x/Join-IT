import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import api from "../services/api";
import StaffTimeline from "./StaffTimeline";
import InternAssigneesDialog from "./InternAssigneesDialog";
import TaskKindBadge from "../components/TaskKindBadge";
import { KIND_OPTIONS, filterByKind } from "../utils/taskKind";
import { PRIORITIES, getPriorityText, getStaffName, hasNoHelper } from "../utils/staffTask";

// ค่าที่จำไว้ในเบราว์เซอร์ (ขึ้นต้น joinit_ เพราะใช้ localStorage ร่วมกับ Order-IT)
const ONLY_NO_HELPER_KEY = "joinit_staffTasksOnlyNoHelper";
// มุมมองบนจอใหญ่: "table" หรือ "timeline" (ไทม์ไลน์แสดงเฉพาะงานเจ้าหน้าที่)
const VIEW_KEY = "joinit_staffTasksView";
// ประเภทงานที่แสดง: "all" | "staff" | "intern"
const KIND_KEY = "joinit_todayTasksKind";

// งานนักศึกษาที่ปิดแล้วไม่ต้องการคนช่วยอีก
const needsHelper = (row) => hasNoHelper(row) && !row.isClosed;

// งานนักศึกษาเก็บผู้รับงานเป็น "ชื่อ::closed|working"
const parseInternHelper = (value) => {
    const [name, status = "working"] = value.split("::");
    return { name, closed: status === "closed" };
};

const TodayTasksSection = ({
    tasks,
    internTasks,
    loading,
    actionLoading,
    filters,
    setFilters,
    reporterFilterTemplate,
    fetchTasks,
    highlightTaskId,
    user,
    confirmJoin,
    confirmLeave,
    confirmAcceptIntern,
    confirmLeaveIntern,
    openEditModal,
    confirmCloseMain,
    confirmReopenMain,
}) => {
    // ผูกงาน/รับงานได้เฉพาะนักศึกษา (แอดมิน/เจ้าหน้าที่ดูได้อย่างเดียว)
    const canJoin = user?.role === "user";
    const [detailDialogVisible, setDetailDialogVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [assigneesTask, setAssigneesTask] = useState(null);

    const [onlyNoHelper, setOnlyNoHelper] = useState(() => localStorage.getItem(ONLY_NO_HELPER_KEY) === "true");
    useEffect(() => {
        localStorage.setItem(ONLY_NO_HELPER_KEY, onlyNoHelper);
    }, [onlyNoHelper]);

    const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || "table");
    useEffect(() => {
        localStorage.setItem(VIEW_KEY, view);
    }, [view]);

    const [kind, setKind] = useState(() => localStorage.getItem(KIND_KEY) || "all");
    useEffect(() => {
        localStorage.setItem(KIND_KEY, kind);
    }, [kind]);

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

    // รวมงานเจ้าหน้าที่และงานนักศึกษาเป็นแถวรูปแบบเดียวกัน (id ของสองตารางซ้ำกันได้ จึงใช้ rowKey)
    const allRows = React.useMemo(() => [
        ...tasks.map((t) => ({
            ...t,
            kind: "staff",
            rowKey: `staff-${t.id}`,
            interns_str: t.interns.join(", "),
        })),
        ...internTasks.map((t) => ({
            ...t,
            kind: "intern",
            rowKey: `intern-${t.id}`,
            interns_str: t.interns.map((value) => parseInternHelper(value).name).join(", "),
        })),
    ], [tasks, internTasks]);

    const kindCounts = {
        all: allRows.length,
        staff: tasks.length,
        intern: internTasks.length,
    };

    const kindRows = React.useMemo(
        () => filterByKind(allRows, kind),
        [allRows, kind]
    );
    const processedRows = React.useMemo(
        () => (onlyNoHelper ? kindRows.filter(needsHelper) : kindRows),
        [kindRows, onlyNoHelper]
    );
    const timelineTasks = processedRows.filter((row) => row.kind === "staff");

    const myContributedTasks = kindRows.filter((row) => row.isContributedByMe).length;
    const noHelperCount = kindRows.filter(needsHelper).length;

    const isOwner = (row) => row.created_by === (user?.full_name || user?.username);

    const kindTemplate = (row) => <TaskKindBadge kind={row.kind} />;

    const priorityTemplate = (rowData) => {
        const priority = PRIORITIES[rowData.priority];
        if (!priority) return <span className="text-slate-300">-</span>;
        return <span className={`text-xs font-bold whitespace-nowrap ${priority.className}`}>{priority.label}</span>;
    };

    const timeTemplate = (rowData) => {
        if (!rowData.time_report) return "-";
        return (
            <span className="font-black text-slate-700">
                {rowData.time_report.substring(0, 5)} น.
            </span>
        );
    };

    // ผู้รับผิดชอบ: งานเจ้าหน้าที่ = เจ้าหน้าที่รับงาน, งานนักศึกษา = ผู้สร้างงาน
    const ownerName = (row) => (row.kind === "intern" ? row.created_by : getStaffName(row));

    const ownerTemplate = (row) => (
        <span
            title={row.kind === "intern" ? "ผู้สร้างงาน" : row.username}
            className={`font-semibold ${row.kind === "intern" ? "text-orange-600" : "text-slate-500"}`}
        >
            {ownerName(row)}
        </span>
    );

    const helpersTemplate = (row) => {
        if (row.interns.length === 0) {
            return (
                <span className="text-slate-300 text-[10px]">
                    {row.kind === "intern" ? "รอผู้รับงาน" : "ยังไม่มีคนช่วย"}
                </span>
            );
        }

        if (row.kind === "staff") {
            return (
                <div className="flex flex-wrap gap-1">
                    {row.interns.map((name, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-full text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-bold">
                            {name}
                        </span>
                    ))}
                </div>
            );
        }

        return (
            <button
                type="button"
                onClick={() => setAssigneesTask(row)}
                title="คลิกเพื่อดูรายละเอียดการช่วยเหลือ"
                className="flex flex-wrap gap-1 items-center bg-transparent border-none p-0 cursor-pointer hover:opacity-80"
            >
                {row.interns.map(parseInternHelper).map((helper, index) => (
                    <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${helper.closed ? "bg-green-600" : "bg-amber-500"}`}
                    >
                        <i className={`pi ${helper.closed ? "pi-check-circle" : "pi-clock"} text-[9px]`}></i>
                        {helper.name}
                    </span>
                ))}
                <i className="pi pi-info-circle text-slate-400 text-[10px] ml-0.5"></i>
            </button>
        );
    };

    const staffActions = (row) => {
        const isJoined = row.isContributedByMe;
        return (
            <>
                {canJoin && (
                    <Button
                        label={isJoined ? "ยกเลิก" : "ผูกงาน"}
                        icon={isJoined ? "pi pi-times" : "pi pi-plus"}
                        rounded
                        loading={actionLoading === row.id}
                        className={`px-3 py-1.5 text-[10px] font-bold border-none transition-all ${isJoined ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100" : "bg-slate-900 hover:bg-slate-700 shadow-lg shadow-slate-200"}`}
                        onClick={() => (isJoined ? confirmLeave(row.id) : confirmJoin(row.id))}
                    />
                )}
                <Button
                    icon="pi pi-eye"
                    rounded
                    text
                    tooltip="ดูรายละเอียด"
                    tooltipOptions={{ position: "top" }}
                    className="px-3 py-1.5 text-[10px] font-bold text-slate-700"
                    onClick={() => showDetailDialog(row)}
                />
            </>
        );
    };

    const internActions = (row) => {
        const isTaker = row.isContributedByMe;
        const owner = isOwner(row);

        if (row.isClosed) {
            return (
                <>
                    <span className="px-3 py-1.5 rounded-full text-[10px] bg-red-100 text-red-600 font-bold whitespace-nowrap">
                        ปิดงานแล้ว
                    </span>
                    {owner && (
                        <Button
                            icon="pi pi-undo"
                            rounded
                            tooltip="ยกเลิกการปิดงาน (เปิดงานใหม่)"
                            tooltipOptions={{ position: "top" }}
                            className="w-7 h-7 p-0 bg-purple-500 hover:bg-purple-600 border-none text-white"
                            onClick={() => confirmReopenMain(row.id)}
                            loading={actionLoading === `intern-reopen-${row.id}`}
                        />
                    )}
                </>
            );
        }

        return (
            <>
                {canJoin && (
                    <Button
                        label={isTaker ? "รับงานแล้ว" : "รับงาน"}
                        icon={isTaker ? "pi pi-check-circle" : "pi pi-check"}
                        rounded
                        loading={actionLoading === `intern-${row.id}`}
                        className={`px-3 py-1.5 text-[10px] font-bold border-none transition-all ${isTaker ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"}`}
                        onClick={() => (isTaker ? confirmLeaveIntern(row.id) : confirmAcceptIntern(row.id))}
                    />
                )}
                {owner && (
                    <>
                        <Button
                            icon="pi pi-pencil"
                            rounded
                            tooltip="แก้ไขงาน"
                            tooltipOptions={{ position: "top" }}
                            className="w-7 h-7 p-0 bg-yellow-500 hover:bg-yellow-600 border-none"
                            onClick={() => openEditModal(row)}
                        />
                        <Button
                            icon="pi pi-power-off"
                            rounded
                            tooltip="ปิดงาน (เสร็จสิ้น)"
                            tooltipOptions={{ position: "top" }}
                            className="w-7 h-7 p-0 bg-red-500 hover:bg-red-600 border-none"
                            onClick={() => confirmCloseMain(row.id)}
                            loading={actionLoading === `intern-close-${row.id}`}
                        />
                    </>
                )}
                <Button
                    icon="pi pi-users"
                    rounded
                    text
                    tooltip="ดูผู้รับงาน"
                    tooltipOptions={{ position: "top" }}
                    className="px-3 py-1.5 text-[10px] font-bold text-slate-700"
                    onClick={() => setAssigneesTask(row)}
                />
            </>
        );
    };

    const actionTemplate = (row) => (
        <div className="flex flex-wrap gap-2 items-center justify-center">
            {row.kind === "intern" ? internActions(row) : staffActions(row)}
        </div>
    );

    const isHighlighted = (row) => row.kind === "staff" && row.id === highlightTaskId;

    return (
        <div className="flex flex-col gap-5">
            {/* 📊 Dashboard Cards (นับตามประเภทงานที่เลือก) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <i className="pi pi-briefcase text-3xl text-blue-500 bg-blue-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            งานทั้งหมด
                        </span>
                        <h2 className="text-3xl font-black text-blue-950 mt-1">
                            {kindRows.length}{" "}
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
                <button
                    type="button"
                    onClick={() => setOnlyNoHelper((value) => !value)}
                    title="กดเพื่อแสดงเฉพาะงานที่ยังไม่มีคนช่วย"
                    className={`text-left bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4 border-l-4 border-l-orange-400 cursor-pointer transition-all ${onlyNoHelper ? "border-orange-300 ring-2 ring-orange-300" : "border-slate-50 hover:shadow-md"}`}
                >
                    <i className="pi pi-user text-3xl text-orange-400 bg-orange-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            ยังไม่มีคนช่วย
                        </span>
                        <h2 className="text-3xl font-black text-orange-950 mt-1">
                            {noHelperCount}{" "}
                            <span className="text-sm font-medium text-slate-400">
                                รายการ
                            </span>
                        </h2>
                    </div>
                </button>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-50 overflow-hidden">
                <div className="p-7 flex flex-wrap gap-4 items-center justify-between bg-slate-900 border-b border-slate-700">
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
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-white/10 p-1 rounded-lg">
                            {KIND_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setKind(option.value)}
                                    className={`px-3 py-1.5 rounded-md border-none text-xs font-bold cursor-pointer transition-all ${kind === option.value ? "bg-white text-slate-900" : "bg-transparent text-slate-300 hover:text-white"}`}
                                >
                                    {option.label} ({kindCounts[option.value]})
                                </button>
                            ))}
                        </div>
                        <div className="hidden md:flex bg-white/10 p-1 rounded-lg">
                            {[
                                { value: "table", label: "ตาราง", icon: "pi-table" },
                                { value: "timeline", label: "ไทม์ไลน์", icon: "pi-align-left" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setView(option.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-none text-xs font-bold cursor-pointer transition-all ${view === option.value ? "bg-white text-slate-900" : "bg-transparent text-slate-300 hover:text-white"}`}
                                >
                                    <i className={`pi ${option.icon} text-xs`}></i>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setOnlyNoHelper((value) => !value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-none text-xs font-bold cursor-pointer transition-all ${onlyNoHelper ? "bg-orange-400 text-white" : "bg-white/10 text-slate-200 hover:bg-white/20"}`}
                        >
                            <i className={`pi ${onlyNoHelper ? "pi-check-square" : "pi-stop"} text-xs`}></i>
                            เฉพาะงานที่ยังไม่มีคนช่วย ({noHelperCount})
                        </button>
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
                        {view === "timeline" ? (
                            <StaffTimeline
                                tasks={timelineTasks}
                                highlightTaskId={highlightTaskId}
                                actionLoading={actionLoading}
                                confirmJoin={confirmJoin}
                                confirmLeave={confirmLeave}
                                onShowDetail={showDetailDialog}
                                canJoin={canJoin}
                            />
                        ) : (
                            <DataTable
                                value={processedRows}
                                dataKey="rowKey"
                                loading={loading}
                                rowClassName={(rowData) => ({
                                    'bg-blue-500/10 border-l-4 border-blue-500 animate-pulse font-bold shadow-inner': isHighlighted(rowData),
                                    'bg-orange-50/40': rowData.kind === "intern",
                                })}
                                paginator
                                rows={10}
                                scrollable
                                rowsPerPageOptions={[10, 25, 50]}
                                stripedRows
                                sortField="time_report"
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
                                    field="kind"
                                    header="ประเภท"
                                    body={kindTemplate}
                                    style={{ width: "8rem" }}
                                    sortable
                                />
                                <Column
                                    field="priority"
                                    header="ความเร่งด่วน"
                                    body={priorityTemplate}
                                    style={{ width: "9rem" }}
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
                                    style={{ width: "15rem" }}
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
                                    header="ผู้รับผิดชอบ"
                                    body={ownerTemplate}
                                    style={{ width: "12rem" }}
                                    sortable
                                    filter
                                    filterElement={reporterFilterTemplate}
                                    showFilterMatchModes={false}
                                />
                                <Column
                                    field="interns_str"
                                    header="ผู้ช่วยเหลือ"
                                    body={helpersTemplate}
                                    style={{ width: "14rem" }}
                                    sortable
                                />
                                <Column
                                    header="จัดการ"
                                    body={actionTemplate}
                                    style={{ textAlign: "center", width: "15rem" }}
                                />
                            </DataTable>
                        )}
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col gap-4">
                        {processedRows.length > 0 ? (
                            processedRows.map((row) => (
                                <div
                                    key={row.rowKey}
                                    className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 relative transition-all duration-500 ${isHighlighted(row)
                                        ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-100 animate-pulse'
                                        : row.kind === "intern" ? 'border-orange-100 shadow-sm' : 'border-slate-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-3">
                                        <div className="flex items-center gap-2">
                                            <i className="pi pi-clock text-slate-400 text-xs"></i>
                                            <span className="font-black text-slate-700 text-sm">
                                                {row.time_report
                                                    ? row.time_report.substring(0, 5) + " น."
                                                    : "-"}
                                            </span>
                                            {kindTemplate(row)}
                                        </div>
                                        <span className="text-slate-500 font-semibold text-xs bg-slate-50 px-2 py-1 rounded-md">
                                            {ownerName(row)}
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
                                    {PRIORITIES[row.priority] && (
                                        <div>{priorityTemplate(row)}</div>
                                    )}
                                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {row.report}
                                    </p>

                                    <div className="flex flex-col gap-2 mt-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            ผู้ช่วยเหลือ
                                        </span>
                                        {helpersTemplate(row)}
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center justify-end mt-2">
                                        {row.kind === "intern" ? internActions(row) : staffActions(row)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium pr-2">
                                ไม่พบรายการงานที่ตรงตามเงื่อนไข
                            </div>
                        )}
                    </div>
                </div>

                {assigneesTask && (
                    <InternAssigneesDialog
                        key={assigneesTask.id}
                        task={assigneesTask}
                        onHide={() => setAssigneesTask(null)}
                    />
                )}

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

export default TodayTasksSection;

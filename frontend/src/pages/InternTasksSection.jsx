import React from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import api, { getImageUrl } from "../services/api";

const InternTasksSection = ({
    internTasks,
    loading,
    actionLoading,
    user,
    setCreateModalVisible,
    confirmAcceptIntern,
    confirmLeaveIntern,
    openEditModal,
    confirmCloseMain,
    confirmReopenMain
}) => {
    const [assigneesDialogVisible, setAssigneesDialogVisible] = React.useState(false);
    const [selectedTaskForAssignees, setSelectedTaskForAssignees] = React.useState(null);
    const [assigneesDetails, setAssigneesDetails] = React.useState([]);
    const [loadingAssignees, setLoadingAssignees] = React.useState(false);

    const fetchAssigneesDetails = async (taskId) => {
        setLoadingAssignees(true);
        try {
            const response = await api.get(`/tasks/intern-task-assignees/${taskId}`);
            if (response.data.success) {
                setAssigneesDetails(response.data.assignees);
            }
        } catch (err) {
            console.error("❌ Fetch Assignees Details Error:", err);
        } finally {
            setLoadingAssignees(false);
        }
    };

    const openAssigneesDialog = (task) => {
        setSelectedTaskForAssignees(task);
        setAssigneesDialogVisible(true);
        fetchAssigneesDetails(task.id);
    };

    const myContributedTasks = internTasks.filter((t) => t.isContributedByMe).length;
    const noHelperTasks = internTasks.filter((t) => !t.interns || t.interns.length === 0).length;

    const processedInternTasks = React.useMemo(() => {
        return internTasks.map((t) => ({
            ...t,
            interns_str: t.interns && t.interns.length > 0 ? t.interns.join(", ") : "",
        }));
    }, [internTasks]);

    const timeTemplate = (rowData) => {
        if (!rowData.time_report) return "-";
        return (
            <span className="font-black text-slate-700">
                {rowData.time_report.substring(0, 5)} น.
            </span>
        );
    };

    const internTakerTemplate = (rowData) => (
        <div 
            className="flex flex-wrap gap-1.5 items-center cursor-pointer hover:opacity-80 transition-all"
            onClick={() => openAssigneesDialog(rowData)}
            title="คลิกเพื่อดูรายละเอียดการช่วยเหลือ"
        >
            {rowData.interns && rowData.interns.length > 0 ? (
                rowData.interns.map((internStr, index) => {
                    const parts = internStr.split('::');
                    const name = parts[0];
                    const status = parts[1] || 'working';

                    return (
                        <Tag
                            key={index}
                            icon={status === 'closed' ? "pi pi-check-circle" : "pi pi-clock"}
                            value={name}
                            rounded
                            className={`px-2.5 py-1.5 text-[10px] font-bold border-none flex items-center gap-1.5 ${status === 'closed'
                                ? 'bg-green-600 text-white'
                                : 'bg-amber-500 text-white'
                                }`}
                        />
                    );
                })
            ) : (
                <span className="text-slate-300 text-[10px] italic">รอผู้รับงาน</span>
            )}
            {rowData.interns && rowData.interns.length > 0 && (
                <i className="pi pi-info-circle text-slate-400 text-[10px] ml-0.5" title="คลิกเพื่อดูรายละเอียดการร่วมงาน"></i>
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
                    <div className="flex items-center gap-2">
                        <Tag value="ปิดงานแล้ว" severity="danger" rounded className="px-3 py-1.5 text-[10px] bg-red-100 text-red-600 border-none font-bold" />
                        {isOwner && (
                            <Button
                                icon="pi pi-undo"
                                rounded
                                severity="help"
                                tooltip="ยกเลิกการปิดงาน (เปิดงานใหม่)"
                                tooltipOptions={{ position: 'top' }}
                                className="w-7 h-7 p-0 bg-purple-500 hover:bg-purple-600 border-none shadow-md shadow-purple-100 text-white"
                                onClick={() => confirmReopenMain(rowData.id)}
                                loading={actionLoading === `intern-reopen-${rowData.id}`}
                            />
                        )}
                    </div>
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
        <div className="flex flex-col gap-5">
            {/* 📊 Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-50 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <i className="pi pi-star text-3xl text-blue-500 bg-blue-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            งานทั้งหมดในระบบ
                        </span>
                        <h2 className="text-3xl font-black text-orange-950 mt-1">
                            {internTasks.length}{" "}
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
                    <i className="pi pi-exclamation-triangle text-3xl text-orange-400 bg-orange-50 p-4 rounded-3xl" />
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            รอผู้รับงาน
                        </span>
                        <h2 className="text-3xl font-black text-red-950 mt-1">
                            {noHelperTasks}{" "}
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
                        <div className="w-1.5 h-10 bg-orange-500 rounded-full"></div>
                        <div>
                            <h3 className="m-0 font-black text-white text-xl tracking-tight">
                                รายการภารกิจมอบหมายพิเศษ
                            </h3>
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">
                                งานส่งต่อและช่วยเหลือกันภายในทีมนักศึกษา
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="สร้างงาน (นักศึกษา)"
                            icon="pi pi-plus"
                            className="bg-orange-500 hover:bg-orange-600 border-none font-bold rounded-xl shadow-md shadow-orange-500/20 px-4 py-2 text-sm text-white transition-all"
                            onClick={() => setCreateModalVisible(true)}
                        />
                    </div>
                </div>

                <div className="p-4">
                    <div className="hidden md:block">
                        <DataTable
                            value={processedInternTasks}
                            loading={loading}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            stripedRows
                            sortField="id"
                            sortOrder={-1}
                            emptyMessage="ไม่พบรายการงานมอบหมายจากเพื่อน"
                            className="p-datatable-sm custom-orange-table custom-luxury-table"
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
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
                                field="interns_str"
                                header="สมาชิกร่วมงาน"
                                body={internTakerTemplate}
                                style={{ width: "14rem" }}
                                headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                                sortable
                            />
                            <Column
                                field="isContributedByMe"
                                header="จัดการ"
                                body={internActionTemplate}
                                style={{ textAlign: "center", width: "23rem" }}
                                headerStyle={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                                sortable
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
                                            <div 
                                                className="flex flex-wrap gap-1.5 items-center cursor-pointer hover:opacity-80 transition-all"
                                                onClick={() => openAssigneesDialog(row)}
                                                title="คลิกเพื่อดูรายละเอียดการช่วยเหลือ"
                                            >
                                                {row.interns && row.interns.length > 0 ? (
                                                    row.interns.map((internStr, index) => {
                                                        const parts = internStr.split('::');
                                                        const name = parts[0];
                                                        const status = parts[1] || 'working';

                                                        return (
                                                            <Tag
                                                                key={index}
                                                                icon={status === 'closed' ? "pi pi-check-circle" : "pi pi-clock"}
                                                                value={name}
                                                                rounded
                                                                className={`px-2.5 py-1.5 text-[10px] font-bold border-none flex items-center gap-1.5 ${status === 'closed'
                                                                    ? 'bg-green-600 text-white shadow-md shadow-green-100'
                                                                    : 'bg-amber-500 text-white shadow-md shadow-amber-100'
                                                                    }`}
                                                            />
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] italic">รอผู้รับงาน</span>
                                                )}
                                                {row.interns && row.interns.length > 0 && (
                                                    <i className="pi pi-info-circle text-slate-400 text-[10px] ml-0.5" title="คลิกเพื่อดูรายละเอียดการร่วมงาน"></i>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-2 relative z-20">
                                            {isClosed ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="w-full text-center py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs border border-red-100">
                                                        <i className="pi pi-lock mr-2 text-[10px]"></i> ปิดงานแล้ว
                                                    </div>
                                                    {isOwner && (
                                                        <Button
                                                            label="ยกเลิกการปิดงาน"
                                                            icon="pi pi-undo"
                                                            loading={actionLoading === `intern-reopen-${row.id}`}
                                                            className="w-full h-10 p-button-sm bg-purple-500 hover:bg-purple-600 border-none rounded-xl text-xs font-bold shadow-md shadow-purple-100 text-white flex items-center justify-center gap-2"
                                                            onClick={() => confirmReopenMain(row.id)}
                                                        />
                                                    )}
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

            <Dialog 
                header={
                    <div className="flex items-center gap-3 text-orange-950">
                        <i className="pi pi-users text-xl bg-orange-100 p-2 rounded-xl text-orange-600"></i>
                        <div>
                            <span className="text-base font-black block leading-tight">ความคืบหน้าทีมผู้ร่วมงาน</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-widest font-bold">
                                {selectedTaskForAssignees?.deviceName || 'รายละเอียดงาน'}
                            </span>
                        </div>
                    </div>
                }
                visible={assigneesDialogVisible} 
                onHide={() => setAssigneesDialogVisible(false)}
                style={{ width: '90vw', maxWidth: '600px' }}
                className="custom-luxury-dialog"
                modal
                dismissableMask
                closeOnEscape
            >
                <div className="flex flex-col gap-4 py-2">
                    {loadingAssignees ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <i className="pi pi-spin pi-spinner text-3xl text-orange-500"></i>
                            <span className="text-slate-400 text-xs font-bold">กำลังโหลดรายละเอียด...</span>
                        </div>
                    ) : assigneesDetails.length > 0 ? (
                        assigneesDetails.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black text-sm overflow-hidden border border-orange-200/30 shadow-sm">
                                            {item.avatar_url ? (
                                                <img src={getImageUrl(item.avatar_url)} alt={item.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                item.full_name?.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="m-0 font-bold text-slate-800 text-sm">{item.full_name}</h5>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">ผู้ร่วมภารกิจ</span>
                                        </div>
                                    </div>
                                    <Tag 
                                        icon={item.status === 'closed' ? "pi pi-check-circle" : "pi pi-clock"}
                                        value={item.status === 'closed' ? 'เสร็จสิ้น' : 'กำลังทำ'}
                                        rounded
                                        className={`px-2.5 py-1 text-[9px] font-extrabold border-none flex items-center gap-1 ${
                                            item.status === 'closed' 
                                            ? 'bg-green-600 text-white shadow-md shadow-green-100' 
                                            : 'bg-amber-500 text-white shadow-md shadow-amber-100'
                                        }`}
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-3 text-xs leading-relaxed">
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <i className="pi pi-pencil text-[10px] text-blue-500"></i> รายละเอียดการช่วยเหลือ
                                        </span>
                                        <p className="m-0 text-slate-700 font-medium">
                                            {item.contribution_detail || <span className="text-slate-300 italic">ยังไม่มีการบันทึกรายละเอียด</span>}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <i className="pi pi-heart text-[10px] text-red-500"></i> สิ่งที่ได้เรียนรู้
                                        </span>
                                        <p className="m-0 text-slate-600 italic">
                                            {item.learning_outcome || <span className="text-slate-300 italic">ยังไม่มีการบันทึกการเรียนรู้</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold">
                            ไม่พบรายละเอียดผู้ร่วมงาน
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default InternTasksSection;

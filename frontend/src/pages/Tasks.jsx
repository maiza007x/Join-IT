import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { FilterMatchMode } from "primereact/api";
import { MultiSelect } from "primereact/multiselect";
import socket from "../services/socket";

import { useAuth } from "../context/AuthContext";

function Tasks() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [internTasks, setInternTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useRef(null);

    const [filters, setFilters] = useState({
        username: { value: null, matchMode: FilterMatchMode.IN }
    });

    const reporters = Array.from(new Set(tasks.map(t => t.username).filter(Boolean)));

    const reporterFilterTemplate = (options) => {
        return (
            <MultiSelect
                value={options.value}
                options={reporters}
                onChange={(e) => options.filterCallback(e.value)}
                placeholder="เลือกผู้แจ้ง"
                className="p-column-filter"
                maxSelectedLabels={1}
            />
        );
    };

    const fetchTasks = async (date = selectedDate, query = searchQuery) => {
        setLoading(true);
        try {
            const formattedDate =
                date instanceof Date ? date.toLocaleDateString("en-CA") : "";
            const response = await api.get(`/tasks/tasks_collab`, {
                params: { date: formattedDate, q: query },
            });
            setTasks(response.data.tasks || []);
            setInternTasks(response.data.internTasks || []);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            toast.current?.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: "โหลดข้อมูลงานล้มหลว",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();

        // ฟัง Socket เพื่อรีเฟรชข้อมูลเมื่อมีงานใหม่
        socket.on("new-task", () => {
            console.log(
                "🔄 [Tasks]: Refreshing task list due to new incoming task...",
            );
            fetchTasks();
        });

        return () => {
            socket.off("new-task");
        };
    }, []);

    const handleJoin = async (taskId) => {
        setActionLoading(taskId);
        try {
            await api.post(`/tasks/join`, { task_staff_id: taskId });
            toast.current.show({
                severity: "success",
                summary: "สำเร็จ",
                detail: "เข้าร่วมงานเรียบร้อย",
                life: 2000,
            });

            // Redirect to My Tasks (Staff Tab)
            // setTimeout(() => {
            //     navigate("/my-tasks?tab=0");
            // }, 1000);

            fetchTasks();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: "ไม่สามารถเข้าร่วมงานได้",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeave = async (taskId) => {
        setActionLoading(taskId);
        try {
            await api.delete(`/tasks/leave/${taskId}`);
            toast.current.show({
                severity: "warn",
                summary: "ยกเลิก",
                detail: "ยกเลิกการผูกงานแล้ว",
                life: 2000,
            });
            fetchTasks();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: "ไม่สามารถยกเลิกได้",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleAcceptInternTask = async (taskId) => {
        setActionLoading(`intern-${taskId}`);
        try {
            await api.put(`/tasks/accept-intern/${taskId}`);
            toast.current.show({
                severity: "success",
                summary: "สำเร็จ",
                detail: "รับงานเรียบร้อย",
                life: 2000,
            });

            // Redirect to My Tasks (Intern Tab)
            // setTimeout(() => {
            //     navigate("/my-tasks?tab=1");
            // }, 1000);

            fetchTasks();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: err.response?.data?.message || "ไม่สามารถรับงานได้",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeaveInternTask = async (taskId) => {
        setActionLoading(`intern-${taskId}`);
        try {
            await api.put(`/tasks/leave-intern/${taskId}`);
            toast.current.show({
                severity: "warn",
                summary: "ยกเลิก",
                detail: "ยกเลิกการรับงานแล้ว",
                life: 2000,
            });
            fetchTasks();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: "ไม่สามารถยกเลิกได้",
            });
        } finally {
            setActionLoading(null);
        }
    };

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

    const internActionTemplate = (rowData) => {
        const isTaker = rowData.username === user?.username;
        const isTaken = !!rowData.username;
        const isLoading = actionLoading === `intern-${rowData.id}`;

        if (isTaken && !isTaker) {
            return (
                <Tag
                    value="มีผู้รับแล้ว"
                    severity="secondary"
                    rounded
                    className="px-3 py-1.5 text-[10px] bg-slate-100 text-slate-400 border-none font-bold"
                />
            );
        }

        return (
            <Button
                label={isTaker ? "รับงานแล้ว" : "รับงาน"}
                icon={isTaker ? "pi pi-check-circle" : "pi pi-check"}
                rounded
                severity={isTaker ? "success" : "info"}
                loading={isLoading}
                className={`px-3 py-1.5 text-[10px] font-bold border-none transition-all ${isTaker ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"}`}
                onClick={() =>
                    isTaker
                        ? confirmLeaveIntern(rowData.id)
                        : confirmAcceptIntern(rowData.id)
                }
            />
        );
    };

    const internTakerTemplate = (rowData) => (
        <div className="flex flex-wrap gap-1">
            {rowData.taker_name ? (
                <Tag
                    value={rowData.taker_name}
                    rounded
                    className="px-2.5 py-1 text-[10px] bg-orange-50 text-orange-600 border border-orange-100 font-bold"
                />
            ) : (
                <span className="text-slate-300 text-[10px] italic">รอผู้รับงาน</span>
            )}
        </div>
    );

    const myContributedTasks = tasks.filter((t) => t.isContributedByMe).length;

    //confirm
    const confirmJoin = (taskId) => {
        confirmDialog({
            message: "ต้องการผูกงานนี้ใช่หรือไม่?",
            header: "ยืนยันการเข้าร่วม",
            icon: "pi pi-user-plus",
            acceptClassName: "p-button-info rounded-xl px-4",
            rejectClassName: "p-button-text rounded-xl px-4",
            accept: () => handleJoin(taskId),
        });
    };

    const confirmLeave = (taskId) => {
        confirmDialog({
            message: "คุณต้องการยกเลิกการผูกงานนี้ใช่หรือไม่?",
            header: "ยืนยันการยกเลิก",
            icon: "pi pi-exclamation-circle",
            acceptClassName: "p-button-danger rounded-xl px-4",
            rejectClassName: "p-button-text rounded-xl px-4",
            accept: () => handleLeave(taskId),
        });
    };

    const confirmAcceptIntern = (taskId) => {
        confirmDialog({
            message: "ต้องการรับผิดชอบงานนี้ใช่หรือไม่?",
            header: "ยืนยันการรับงาน",
            icon: "pi pi-check-circle",
            acceptClassName: "p-button-info rounded-xl px-4",
            rejectClassName: "p-button-text rounded-xl px-4",
            accept: () => handleAcceptInternTask(taskId),
        });
    };

    const confirmLeaveIntern = (taskId) => {
        confirmDialog({
            message: "คุณต้องการยกเลิกการรับงานนี้ใช่หรือไม่?",
            header: "ยืนยันการคืนงาน",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger rounded-xl px-4",
            rejectClassName: "p-button-text rounded-xl px-4",
            accept: () => handleLeaveInternTask(taskId),
        });
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-700">
            <Toast ref={toast} />

            <div className="max-w-312.5 mx-auto py-8 px-4 flex flex-col gap-6">
                {/* 🔍 Filter & Search Bar */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
                    <div className="flex flex-wrap gap-5 items-end">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                                คัดกรองวันที่
                            </span>
                            <Calendar
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.value)}
                                dateFormat="yy-mm-dd"
                                showIcon
                                className="w-full md:w-56 custom-calendar shadow-inner"
                            />
                        </div>
                        <div className="flex flex-col gap-2 grow">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                ค้นหางาน (ปัญหา, อุปกรณ์, แผนก)
                            </span>
                            <div className="relative w-full">
                                <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 text-sm" />
                                <InputText
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="พิมพ์สิ่งที่ต้องการค้นหา..."
                                    style={{ paddingLeft: "2.75rem" }}
                                    className="w-full rounded-2xl border-slate-100 bg-slate-50/50 py-3 focus:ring-2 focus:ring-blue-100 transition-all text-sm shadow-inner"
                                />
                            </div>
                        </div>
                        <Button
                            label="ค้นหา"
                            icon="pi pi-filter"
                            className="rounded-2xl px-8 bg-blue-600 border-none font-bold h-12 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                            onClick={() => fetchTasks()}
                            loading={loading}
                        />
                    </div>
                </div>

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
                                    Update: {new Date().toLocaleTimeString()} น.
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
                                removableSort // ✅ กดหัวตารางซ้ำเพื่อเลิก Sort ได้
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

                {/* Intern Tasks Data Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden mt-2">
                    <div className="p-7 flex items-center justify-between bg-white border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-orange-400 rounded-full"></div>
                            <div>
                                <h3 className="m-0 font-black text-slate-800 text-xl tracking-tight">
                                    รายการภารกิจมอบหมายพิเศษ (โดยนักศึกษา)
                                </h3>
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">
                                    งานส่งต่อและช่วยเหลือกันภายในทีม
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="hidden md:block">
                            <DataTable
                                value={internTasks}
                                loading={loading}
                                paginator
                                rows={10}
                                stripedRows
                                sortField="id"
                                sortOrder={-1}
                                emptyMessage="ไม่พบรายการงานมอบหมายจากเพื่อน"
                                className="p-datatable-sm custom-luxury-table"
                                rowHover
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                currentPageReportTemplate="{first}-{last} of {totalRecords}"
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
                                    header="อุปกรณ์ / แผนก"
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
                                    style={{ width: "18rem" }}
                                    sortable
                                />
                                <Column
                                    field="report"
                                    header="รายละเอียดปัญหา"
                                    className="text-slate-600 leading-relaxed"
                                />
                                <Column
                                    field="reporter"
                                    header="ผู้แจ้ง"
                                    body={(row) => (
                                        <span className="text-slate-500 font-semibold italic">
                                            {row.reporter}
                                        </span>
                                    )}
                                    style={{ width: "9rem" }}
                                    sortable
                                />
                                <Column
                                    header="ผู้รับงาน"
                                    body={internTakerTemplate}
                                    style={{ width: "14rem" }}
                                />
                                <Column
                                    header="จัดการ"
                                    body={internActionTemplate}
                                    style={{ textAlign: "center", width: "13rem" }}
                                />
                            </DataTable>
                        </div>

                        {/* Mobile Cards (Intern Tasks) */}
                        <div className="md:hidden flex flex-col gap-4">
                            {internTasks.length > 0 ? (
                                internTasks.map((row, i) => {
                                    const isTaker = row.username === user?.username;
                                    const isTaken = !!row.username;
                                    const isLoading = actionLoading === `intern-${row.id}`;
                                    return (
                                        <div
                                            key={i}
                                            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3 relative border-t-4 border-t-orange-400"
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
                                                    {row.reporter}
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
                                            <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                {row.report}
                                            </p>

                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    ผู้รับงาน
                                                </span>
                                                {row.taker_name ? (
                                                    <Tag
                                                        value={row.taker_name}
                                                        rounded
                                                        className="px-2.5 py-1 text-[10px] bg-orange-50 text-orange-600 border border-orange-100 font-bold self-start"
                                                    />
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] italic">
                                                        รอผู้รับงาน
                                                    </span>
                                                )}
                                            </div>

                                            {(!isTaken || isTaker) && (
                                                <Button
                                                    label={isTaker ? "รับงานแล้ว" : "รับงาน"}
                                                    icon={isTaker ? "pi pi-check-circle" : "pi pi-check"}
                                                    loading={isLoading}
                                                    className={`w-full h-10 p-button-sm border-none rounded-xl text-xs font-bold mt-2 shadow-md transition-all ${isTaker ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                                                    onClick={() =>
                                                        isTaker
                                                            ? confirmLeaveIntern(row.id)
                                                            : confirmAcceptIntern(row.id)
                                                    }
                                                />
                                            )}
                                            {isTaken && !isTaker && (
                                                <div className="w-full text-center py-3 bg-slate-50 rounded-xl text-slate-400 text-[10px] font-bold border border-slate-100 border-dashed mt-2">
                                                    มีคนรับงานแล้ว
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                                    ไม่มีงานมอบหมายพิเศษในวันนี้
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                /* Sort Icon Styling */
                .p-sortable-column-icon {
                    font-size: 10px !important;
                    margin-left: 0.5rem !important;
                    color: #94a3b8 !important;
                }
                .p-highlight .p-sortable-column-icon {
                    color: #2563eb !important;
                }

                /* DataTable Head Styling */
                .custom-luxury-table .p-datatable-thead > tr > th {
                    background-color: #fafafa !important;
                    color: #94a3b8 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.15em !important;
                    border-bottom: 2px solid #f1f5f9 !important;
                    padding: 1.5rem 1rem !important;
                    transition: all 0.2s;
                }
                .custom-luxury-table .p-datatable-thead > tr > th:hover {
                    background-color: #f1f5f9 !important;
                    color: #475569 !important;
                }
                /* DataTable Body Styling */
                .p-datatable-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 1.25rem 1rem !important;
                }
                /* Row Hover Effect */
                .p-datatable-tbody > tr:hover {
                    background-color: #fcfdfe !important;
                }
                /* Striped Rows */
                .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) {
                    background-color: #f8fafc !important;
                }
                /* Calendar Input styling */
                .custom-calendar input {
                    border-radius: 1.25rem !important;
                    border: 1px solid #eff6ff !important;
                    background: #fcfdfe !important;
                    padding: 0.75rem 1rem !important;
                    font-weight: 600;
                    color: #475569;
                    width: 100%;
                }
                /* Paginator styling */
                .p-paginator {
                    border: none !important;
                    padding: 1.5rem !important;
                    background: transparent !important;
                    border-top: 1px solid #f1f5f9 !important;
                }
                .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
                    background: #2563eb !important;
                    color: white !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }
                .p-paginator .p-paginator-current {
                    color: #94a3b8 !important;
                    font-size: 12px !important;
                }
            `,
                }}
            />
        </div>
    );
}

export default Tasks;
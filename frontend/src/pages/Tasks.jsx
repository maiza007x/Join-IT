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
import EditInternTask from "./EditInternTask";
import CreateInternTaskModal from "./CreateInternTaskModal";
import StaffTasksSection from "./StaffTasksSection";
import InternTasksSection from "./InternTasksSection";
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

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("staff");

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
                date instanceof Date ? date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) : "";
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
        let debounceTimer;
        const handleNewTask = () => {
            console.log("🔄 [Tasks]: Task update received. Scheduling refresh...");
            clearTimeout(debounceTimer);
            // Debounce การดึงข้อมูลเพื่อป้องกันการยิง API ซ้ำซ้อนเมื่อมีหลาย socket events เข้ามาพร้อมกัน
            debounceTimer = setTimeout(() => {
                fetchTasks();
            }, 1000);
        };

        socket.on("new-task", handleNewTask);

        return () => {
            socket.off("new-task", handleNewTask);
            clearTimeout(debounceTimer);
        };
    }, [selectedDate]);

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

    const openEditModal = (task) => {
        setEditingTask(task);
        setEditModalVisible(true);
    };

    const handleEditSuccess = () => {
        setEditModalVisible(false);
        fetchTasks();
    };

    const handleCloseMainTask = async (taskId) => {
        setActionLoading(`intern-close-${taskId}`);
        try {
            await api.put(`/tasks/close-intern-task-main/${taskId}`);
            toast.current.show({
                severity: "success",
                summary: "สำเร็จ",
                detail: "ปิดงานเรียบร้อย",
                life: 2000,
            });
            fetchTasks();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: "ไม่สามารถปิดงานได้",
            });
        } finally {
            setActionLoading(null);
        }
    };


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

    const confirmCloseMain = (taskId) => {
        confirmDialog({
            message: "คุณต้องการปิดงานนี้อย่างสมบูรณ์ใช่หรือไม่? (เพื่อนจะไม่สามารถรับงานนี้ได้อีก)",
            header: "ยืนยันการปิดงาน",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger rounded-xl px-4",
            rejectClassName: "p-button-text rounded-xl px-4",
            accept: () => handleCloseMainTask(taskId),
        });
    };


    const handleDateChange = (direction) => {
        const current = selectedDate ? new Date(selectedDate) : new Date();
        current.setDate(current.getDate() + direction);
        setSelectedDate(current);
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-700">
            <Toast ref={toast} />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 flex flex-col gap-6">
                {/* 🔍 Filter & Search Bar */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-50">
                    <div className="flex flex-wrap gap-5 items-end">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-black text-blue-500 uppercase tracking-widest ml-1">
                                คัดกรองวันที่
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDateChange(-1)}
                                    className="w-13 h-13 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all"
                                >
                                    <i className="pi pi-chevron-left text-xs"></i>
                                </button>
                                <Calendar
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.value)}
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    className="w-full md:w-56"
                                />
                                <button
                                    onClick={() => handleDateChange(1)}
                                    className="w-13 h-13 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all"
                                >
                                    <i className="pi pi-chevron-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 grow">
                            <span className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
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

                {/* Custom HRMS-style Tabs */}
                <div className="flex gap-4 border-b border-slate-200 mt-2 mb-2">
                    <button
                        className={`pb-4 px-4 font-bold text-sm transition-all relative ${activeTab === "staff" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                            }`}
                        onClick={() => setActiveTab("staff")}
                    >
                        <div className="flex items-center gap-2">
                            <i className="pi pi-briefcase"></i>
                            งานประจำวัน (โดยเจ้าหน้าที่)
                        </div>
                        {activeTab === "staff" && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>
                        )}
                    </button>
                    <button
                        className={`pb-4 px-4 font-bold text-sm transition-all relative ${activeTab === "intern" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                            }`}
                        onClick={() => setActiveTab("intern")}
                    >
                        <div className="flex items-center gap-2">
                            <i className="pi pi-star"></i>
                            งานสำหรับนักศึกษา
                        </div>
                        {activeTab === "intern" && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in-up">
                    {activeTab === "staff" && (
                        <StaffTasksSection
                            tasks={tasks}
                            loading={loading}
                            actionLoading={actionLoading}
                            filters={filters}
                            setFilters={setFilters}
                            reporterFilterTemplate={reporterFilterTemplate}
                            fetchTasks={fetchTasks}
                            confirmJoin={confirmJoin}
                            confirmLeave={confirmLeave}
                        />
                    )}

                    {activeTab === "intern" && (
                        <InternTasksSection
                            internTasks={internTasks}
                            loading={loading}
                            actionLoading={actionLoading}
                            user={user}
                            setCreateModalVisible={setCreateModalVisible}
                            confirmAcceptIntern={confirmAcceptIntern}
                            confirmLeaveIntern={confirmLeaveIntern}
                            openEditModal={openEditModal}
                            confirmCloseMain={confirmCloseMain}
                        />
                    )}
                </div>

                {/* Edit Intern Task Modal */}
                <EditInternTask
                    visible={editModalVisible}
                    onHide={() => setEditModalVisible(false)}
                    taskData={editingTask}
                    onSuccess={handleEditSuccess}
                />

                {/* Create Intern Task Modal */}
                <CreateInternTaskModal
                    visible={createModalVisible}
                    onHide={() => setCreateModalVisible(false)}
                    onSuccess={() => {
                        setCreateModalVisible(false);
                        fetchTasks();
                    }}
                />
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
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
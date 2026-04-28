import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from '../services/api';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import * as XLSX from 'xlsx'; // ✅ เพิ่ม library สำหรับ Excel
import { saveAs } from "file-saver";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { useAuth } from "../context/AuthContext";
import { confirmDialog } from "primereact/confirmdialog";

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [internTasks, setInternTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [staffView, setStaffView] = useState('pending');
    const [internView, setInternView] = useState('pending');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [formData, setFormData] = useState({
        contribution_detail: '',
        learning_outcome: '',
        mentor_feedback: ''
    });

    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useRef(null);

    const fetchMyTasks = useCallback(async () => {
        setLoading(true);
        try {
            let formattedDate = '';
            if (selectedDate) {
                const offset = selectedDate.getTimezoneOffset();
                const adjustedDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
                formattedDate = adjustedDate.toISOString().split('T')[0];
            }

            const res = await API.get('/tasks/my-tasks', {
                params: { date: formattedDate, q: searchQuery }
            });
            setTasks(res.data.tasks || []);
            setInternTasks(res.data.internTasks || []);
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'โหลดข้อมูลไม่สำเร็จ' });
        } finally {
            setLoading(false);
        }
    }, [selectedDate, searchQuery]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks, location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab !== null) {
            setActiveTab(parseInt(tab));
        }
    }, [location.search]);

    const pendingTasks = tasks.filter(t => !t.contribution_detail || t.contribution_detail === '');
    const completedTasks = tasks.filter(t => t.contribution_detail && t.contribution_detail !== '');

    const pendingInternTasks = internTasks.filter(t => Number(t.status) === 2);
    const completedInternTasks = internTasks.filter(t => Number(t.status) === 3);

    // รวมประวัติงานทั้งหมด
    const allCompletedTasks = [
        ...completedTasks.map(t => ({ ...t, display_type: 'Staff' })),
        ...completedInternTasks.map(t => ({ ...t, display_type: 'Intern', contribution_id: t.id }))
    ].sort((a, b) => new Date(b.date_report) - new Date(a.date_report));

    // ✅ ฟังก์ชัน Export ข้อมูลเป็น Excel
    const exportToExcel = () => {
        if (completedTasks.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'แจ้งเตือน', detail: 'ไม่มีข้อมูลสำเร็จที่สามารถ Export ได้' });
            return;
        }

        const dataToExport = completedTasks.map((task, index) => ({
            "ลำดับ": index + 1,
            "วันที่": task.date_report,
            "เวลา": task.time_report ? task.time_report.substring(0, 5) : "-",
            "อุปกรณ์/ชื่องาน": task.deviceName,
            "ปัญหาที่แจ้ง": task.report,
            "สรุปการดำเนินงาน": task.contribution_detail,
            "สิ่งที่ได้เรียนรู้": task.learning_outcome || "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "MyTasks");

        const fileName = `Report_MyTasks_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'ส่งออกไฟล์ Excel เรียบร้อยแล้ว' });
    };

    // ✅ ฟังก์ชัน Export ข้อมูลเป็น Word โดยใช้ Template (report.docx)
    const exportToWord = async () => {
        // หาวันจันทร์ถึงวันศุกร์ของสัปดาห์ตาม selectedDate
        const baseDate = selectedDate ? new Date(selectedDate) : new Date();
        const dayOfWeek = baseDate.getDay(); // 0 is Sunday, 1 is Monday
        const diffToMonday = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(baseDate);
        monday.setDate(diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        const formatThaiDate = (d) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        };

        const mondayStr = formatThaiDate(monday);
        const fridayStr = formatThaiDate(friday);

        confirmDialog({
            message: (
                <>
                    ต้องการ export ข้อมูลในช่วงวันที่ ({mondayStr})จันทร์ - ศุกร์({fridayStr}) ใช่หรือไม่?
                    <br />
                    หากต้องการเปลี่ยนสัปดาห์ สามารถแก้ไขที่ปฏิทิน
                </>
            ),
            header: 'ยืนยันการ Export Word',
            icon: 'pi pi-file-word',
            acceptClassName: 'p-button-info rounded-xl px-4',
            rejectClassName: 'p-button-text rounded-xl px-4',
            accept: async () => {
                try {
                    // ดึงข้อมูลงานทั้งหมดโดยไม่ฟิลเตอร์วันที่ เพื่อดึงงานทั้งสัปดาห์
                    const res = await API.get('/tasks/my-tasks', {
                        params: { q: searchQuery }
                    });

                    const allTasks = res.data.tasks || [];
                    const allInternTasks = res.data.internTasks || [];

                    const completedTasksAll = allTasks.filter(t => t.contribution_detail && t.contribution_detail !== '');
                    const completedInternTasksAll = allInternTasks.filter(t => Number(t.status) === 3);

                    const tasksToExport = [...completedTasksAll, ...completedInternTasksAll];

                    // เรียงวันที่จากเก่าไปใหม่ (ascending)
                    const sortedTasks = [...tasksToExport].sort((a, b) => new Date(a.date_report) - new Date(b.date_report));

                    const renderData = {
                        full_name: user?.full_name || user?.username || "-",
                        fullName: user?.full_name || user?.username || "-",
                        university_name: user?.university_name || "-",
                        universityName: user?.university_name || "-",
                        academic_year: user?.academic_year || "-",
                        academicYear: user?.academic_year || "-",
                        faculty: user?.faculty || "-",
                        term: user?.term || "-",
                        number_of_week: "" // ยังไม่ต้องทำอะไรในตอนนี้
                    };

                    const weekDatesMap = {}; // mapping YYYY-MM-DD to dayIndex (1-6)

                    for (let i = 0; i < 5; i++) { // 0 ถึง 4 คือ จันทร์ ถึง ศุกร์
                        const d = new Date(monday);
                        d.setDate(monday.getDate() + i);

                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const yyyy = d.getFullYear();

                        const dayIndex = i + 1; // 1 ถึง 5
                        renderData[`memo_date_${dayIndex}`] = `${dd}/${mm}/${yyyy}`;
                        renderData[`note_today_${dayIndex}`] = ""; // เตรียมเผื่อไว้

                        // Map เอาไว้เช็คกับวันที่ใน task
                        weekDatesMap[`${yyyy}-${mm}-${dd}`] = dayIndex;

                        // เตรียมตัวแปร task 5 บรรทัด (ใช้ index 0 ถึง 4)
                        for (let taskIdx = 0; taskIdx < 5; taskIdx++) {
                            renderData[`memo[${taskIdx}]_${dayIndex}`] = ".......................................................................................................";
                        }
                    }

                    const taskCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

                    sortedTasks.forEach(task => {
                        if (!task.date_report) return;

                        let tYYYY, tMM, tDD;
                        // Parse string date เช่น 2026-04-27
                        if (typeof task.date_report === 'string' && (task.date_report.includes('-') || task.date_report.includes('/'))) {
                            const parts = task.date_report.split(/[-/ T]/);
                            const validParts = parts.filter(p => p.length > 0);
                            if (validParts[0].length === 4) {
                                tYYYY = validParts[0];
                                tMM = validParts[1].padStart(2, '0');
                                tDD = validParts[2].padStart(2, '0');
                            } else {
                                tDD = validParts[0].padStart(2, '0');
                                tMM = validParts[1].padStart(2, '0');
                                tYYYY = validParts[2];
                            }
                        } else {
                            const tDate = new Date(task.date_report);
                            tYYYY = tDate.getFullYear();
                            tMM = String(tDate.getMonth() + 1).padStart(2, '0');
                            tDD = String(tDate.getDate()).padStart(2, '0');
                        }

                        const dateKey = `${tYYYY}-${tMM}-${tDD}`;

                        if (weekDatesMap[dateKey]) {
                            const dayIndex = weekDatesMap[dateKey];

                            // ใส่ข้อมูลได้สูงสุด 5 งานต่อวัน (index 0 ถึง 4)
                            const detail = task.contribution_detail ? String(task.contribution_detail).trim() : ".......................................................................................................";

                            if (taskCounts[dayIndex] < 5) {
                                const arrayIndex = taskCounts[dayIndex]; // 0 ถึง 4
                                taskCounts[dayIndex]++;
                                renderData[`memo[${arrayIndex}]_${dayIndex}`] = detail;
                            } else {
                                // กรณีมีงานมากกว่า 5 งานต่อวัน จะนำไปต่อท้ายที่บรรทัดที่ 5 (index 4)
                                const lastIndex = 4;
                                const currentVal = renderData[`memo[${lastIndex}]_${dayIndex}`];

                                taskCounts[dayIndex]++;

                                if (currentVal === ".......................................................................................................") {
                                    renderData[`memo[${lastIndex}]_${dayIndex}`] = detail;
                                } else {
                                    renderData[`memo[${lastIndex}]_${dayIndex}`] += `\n${taskCounts[dayIndex]}. ${detail}`;
                                }
                            }
                        }
                    });

                    // 1. โหลดไฟล์ template จาก /public/report.docx
                    const response = await fetch("/report.docx");
                    if (!response.ok) throw new Error("ไม่สามารถโหลดไฟล์ template.docx ได้ที่ /public/report.docx");
                    const content = await response.arrayBuffer();

                    // 2. เตรียมข้อมูลสำหรับใส่ใน template
                    const zip = new PizZip(content);
                    const doc = new Docxtemplater(zip, {
                        paragraphLoop: true,
                        linebreaks: true,
                    });

                    // ใส่ข้อมูลลงใน Template
                    doc.render(renderData);

                    // 3. สร้างและดาวน์โหลดไฟล์
                    const out = doc.getZip().generate({
                        type: "blob",
                        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    });

                    saveAs(out, `แบบบันทึกภาระงาน_${user?.username || 'export'}_${new Date().toISOString().split('T')[0]}.docx`);
                    toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'ส่งออกไฟล์ Word เรียบร้อยแล้ว' });

                } catch (error) {
                    console.error("Export Word Error:", error);
                    toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถสร้างไฟล์ Word ได้: ' + error.message });
                }
            }
        });
    };

    const timeTemplate = (rowData) => {
        if (!rowData.time_report) return "-";
        return <span className="font-bold text-blue-600">{rowData.time_report.substring(0, 5)} น.</span>;
    };

    const deviceTemplate = (rowData) => {
        return (
            <div className="py-1">
                <div className="font-bold text-slate-800 text-base">
                    {rowData.deviceName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <i className="pi pi-map-marker text-blue-400 text-[10px]"></i>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        {rowData.department_name || rowData.department || '-'}
                    </span>
                </div>
            </div>
        );
    };

    const summaryTemplate = (rowData) => {
        const detail = rowData.contribution_detail || "ยังไม่ได้บันทึกรายละเอียด";
        const tooltipId = `summary-${rowData.contribution_id}`;

        return (
            <>
                <Tooltip target={`.${tooltipId}`} content={detail} position="top" />
                <div
                    className={`${tooltipId} text-xs text-slate-500 cursor-help line-clamp-2 leading-relaxed`}
                    style={{ maxWidth: '250px' }}
                >
                    {detail}
                </div>
            </>
        );
    };

    const openDetails = (task) => {
        setSelectedTask(task);
        setFormData({
            contribution_detail: task.contribution_detail || "",
            learning_outcome: task.learning_outcome || "",
            mentor_feedback: task.mentor_feedback || ""
        });
        setShowModal(true);
    };

    const handleSaveNote = async () => {
        if (!formData.contribution_detail.trim()) {
            toast.current.show({ severity: 'warn', summary: 'คำเตือน', detail: 'กรุณากรอกรายละเอียดสิ่งที่ได้ทำ' });
            return;
        }
        setLoading(true);
        try {
            if (selectedTask.type === 'staff') {
                await API.put(`/tasks/contribution/${selectedTask.contribution_id}`, formData);
            } else {
                await API.put(`/tasks/intern-details/${selectedTask.id}`, formData);
            }
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
            setShowModal(false);
            fetchMyTasks();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'บันทึกไม่สำเร็จ' });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseTask = async () => {
        if (!formData.contribution_detail.trim()) {
            toast.current.show({ severity: 'warn', summary: 'คำเตือน', detail: 'กรุณากรอกรายละเอียดก่อนปิดงาน' });
            return;
        }
        setLoading(true);
        try {
            await API.put(`/tasks/close-intern/${selectedTask.id}`, formData);
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'ปิดงานเรียบร้อยแล้ว' });
            setShowModal(false);
            fetchMyTasks();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'ปิดงานไม่สำเร็จ' });
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!selectedTask) return;
        setLoading(true);
        try {
            if (selectedTask.type === 'staff') {
                await API.delete(`/tasks/leave/${selectedTask.task_staff_id}`);
            } else {
                await API.put(`/tasks/leave-intern/${selectedTask.intern_task_id || selectedTask.id}`);
            }
            toast.current.show({
                severity: "warn",
                summary: "ยกเลิก",
                detail: "ยกเลิกการเข้าร่วมงานแล้ว",
                life: 2000,
            });
            setShowModal(false);
            fetchMyTasks();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "ผิดพลาด",
                detail: "ไม่สามารถยกเลิกได้",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (direction) => {
        const current = selectedDate ? new Date(selectedDate) : new Date();
        current.setDate(current.getDate() + direction);
        setSelectedDate(current);
    };

    return (
        <div className="bg-[#f0f9ff] min-h-screen p-4 md:p-8 font-sans text-slate-700">
            <Toast ref={toast} />

            <div className="max-w-312.5 mx-auto flex flex-col gap-6">

                {/* Header & Filter Section */}
                <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-100 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/tasks")}
                            className="w-12 h-12 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl transition-all border border-blue-100 shadow-sm"
                        >
                            <i className="pi pi-arrow-left font-bold text-lg"></i>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-blue-900 leading-none">งานของฉัน</h1>
                            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mt-1">Management & Logs</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
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
                                className="w-44"
                                showButtonBar
                            />
                            <button
                                onClick={() => handleDateChange(1)}
                                className="w-13 h-13 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all"
                            >
                                <i className="pi pi-chevron-right text-xs"></i>
                            </button>
                        </div>
                        <div className="relative">
                            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-blue-300"></i>
                            <InputText
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchMyTasks()}
                                placeholder="ค้นหาชื่องาน..."
                                style={{ paddingLeft: '2.5rem' }}
                                className="rounded-xl border-blue-50 bg-blue-50/30 text-sm py-2"
                            />
                        </div>
                        <Button
                            icon="pi pi-filter"
                            onClick={fetchMyTasks}
                            className="bg-blue-600 border-none rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100"
                            loading={loading}
                        />
                        <Button
                            icon="pi pi-file-word"
                            label="Export Word"
                            onClick={exportToWord}
                            className="bg-[#2b579a] border-none rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-200 ml-2"
                        />
                    </div>
                </div>

                {/* Tab Selection Section */}
                <div className="bg-white p-2 rounded-3xl shadow-sm border border-blue-50">
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)} className="custom-luxury-tabs">
                        <TabPanel header={<span><i className="pi pi-building mr-2"></i>งานเจ้าหน้าที่ ({tasks.length})</span>}>
                            <div className="flex flex-col gap-6 pt-4">
                                {/* Segmented Control for Staff */}
                                <div className="flex justify-center md:justify-start">
                                    <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
                                        <button
                                            onClick={() => setStaffView('pending')}
                                            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${staffView === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            รอยืนยันรายละเอียด ({pendingTasks.length})
                                        </button>
                                        <button
                                            onClick={() => setStaffView('completed')}
                                            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${staffView === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            งานที่เสร็จสิ้น ({completedTasks.length})
                                        </button>
                                    </div>
                                </div>

                                {/* Staff Pending Table */}
                                {staffView === 'pending' && (
                                    <div className="bg-white rounded-4xl border border-blue-50 overflow-hidden shadow-sm">
                                        <div className="p-5 bg-blue-600 flex items-center gap-3 text-white">
                                            <i className="pi pi-clock"></i>
                                            <h4 className="m-0 font-bold">รอยืนยันรายละเอียด ({pendingTasks.length})</h4>
                                        </div>
                                        <div className="p-4">
                                            <div className="hidden md:block">
                                                <DataTable value={pendingTasks} loading={loading} rows={10} scrollable emptyMessage="ไม่พบรายการงาน" className="p-datatable-sm custom-blue-table">
                                                    <Column field="time_report" header="เวลา" body={timeTemplate} style={{ width: '7rem' }} sortable />
                                                    <Column field="date_report" header="วันที่" style={{ width: '9rem' }} className="text-slate-400" sortable />
                                                    <Column field="deviceName" header="อุปกรณ์" body={deviceTemplate} style={{ width: '15rem' }} sortable />
                                                    <Column field="report" header="รายละเอียดปัญหา" className="text-slate-600" sortable />
                                                    <Column header="จัดการ" body={(row) => (
                                                        <Button label="บันทึก" icon="pi pi-pencil" rounded className="py-1 px-3 text-[10px] font-bold bg-blue-600 border-none hover:bg-blue-700" onClick={() => openDetails({ ...row, type: 'staff' })} />
                                                    )} style={{ textAlign: 'center', width: '7rem' }} />
                                                </DataTable>
                                            </div>
                                            {/* Mobile pending staff */}
                                            <div className="md:hidden flex flex-col gap-4">
                                                {pendingTasks.map((task, i) => (
                                                    <div key={i} className="bg-white border border-blue-50 rounded-2xl p-4 shadow-sm flex flex-col gap-3 border-l-4 border-l-blue-500">
                                                        <div className="flex justify-between items-center pb-2">
                                                            <span className="font-bold text-blue-600">{task.time_report?.substring(0, 5)} น.</span>
                                                            <span className="text-slate-400 text-xs">{task.date_report}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <h4 className="font-bold text-slate-800 text-base m-0 leading-tight">
                                                                {task.deviceName}
                                                            </h4>
                                                            <div className="flex items-center gap-1.5">
                                                                <i className="pi pi-map-marker text-blue-400 text-[10px]"></i>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    {task.department_name || task.department || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button label="บันทึกข้อมูล" icon="pi pi-pencil" className="bg-blue-600 p-button-sm rounded-xl" onClick={() => openDetails({ ...task, type: 'staff' })} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Staff History Table */}
                                {staffView === 'completed' && (
                                    <div className="bg-white rounded-4xl border border-blue-50 overflow-hidden shadow-sm animate-fade-in-up">
                                        <div className="p-5 bg-slate-50 border-b border-blue-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-blue-900">
                                                <i className="pi pi-check-circle"></i>
                                                <h4 className="m-0 font-bold">งานที่เสร็จสิ้น ({completedTasks.length})</h4>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <DataTable value={completedTasks} loading={loading} paginator rows={5} className="p-datatable-sm custom-blue-table">
                                                <Column field="date_report" header="วันที่" style={{ width: '9rem' }} sortable />
                                                <Column field="deviceName" header="อุปกรณ์" body={deviceTemplate} style={{ width: '15rem' }} sortable />
                                                <Column field="contribution_detail" header="สรุปผล" body={summaryTemplate} />
                                                <Column header="แก้ไข" body={(row) => <Button icon="pi pi-file-edit" text rounded onClick={() => openDetails({ ...row, type: 'staff' })} />} style={{ width: '5rem' }} />
                                            </DataTable>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabPanel>

                        <TabPanel header={<span><i className="pi pi-user mr-2"></i>งานนักศึกษา ({internTasks.length})</span>}>
                            <div className="flex flex-col gap-6 pt-4">
                                {/* Segmented Control for Intern */}
                                <div className="flex justify-center md:justify-start">
                                    <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
                                        <button
                                            onClick={() => setInternView('pending')}
                                            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${internView === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            งานที่รับผิดชอบ ({pendingInternTasks.length})
                                        </button>
                                        <button
                                            onClick={() => setInternView('completed')}
                                            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${internView === 'completed' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            งานที่เสร็จสิ้น ({completedInternTasks.length})
                                        </button>
                                    </div>
                                </div>

                                {/* Intern Pending Table */}
                                {internView === 'pending' && (
                                    <div className="bg-white rounded-4xl border border-white overflow-hidden shadow-md shadow-orange-100/30">
                                        <div className="p-5 bg-orange-500 flex items-center gap-3 text-white">
                                            <i className="pi pi-user-edit"></i>
                                            <h4 className="m-0 font-bold">งานที่รับผิดชอบ ({pendingInternTasks.length})</h4>
                                        </div>
                                        <div className="p-4">
                                            <DataTable value={pendingInternTasks} loading={loading} rows={10} scrollable emptyMessage="ไม่มีงานที่กำลังทำ" className="p-datatable-sm custom-orange-table">
                                                <Column field="time_report" header="เวลา" body={timeTemplate} style={{ width: '7rem' }} sortable />
                                                <Column field="date_report" header="วันที่" style={{ width: '9rem' }} sortable />
                                                <Column field="deviceName" header="อุปกรณ์/ชื่องาน" body={deviceTemplate} style={{ width: '15rem' }} sortable />
                                                <Column field="report" header="รายละเอียดปัญหา" className="text-slate-600" />
                                                <Column header="จัดการ" body={(row) => (
                                                    <Button label="บันทึก" icon="pi pi-pencil" rounded className="py-1 px-3 text-[10px] font-bold bg-orange-500 border-none hover:bg-orange-600" onClick={() => openDetails({ ...row, type: 'intern' })} />
                                                )} style={{ textAlign: 'center', width: '7rem' }} />
                                            </DataTable>
                                        </div>
                                    </div>
                                )}

                                {/* Intern History Table */}
                                {internView === 'completed' && (
                                    <div className="bg-white rounded-4xl border border-orange-50 overflow-hidden shadow-sm animate-fade-in-up">
                                        <div className="p-5 bg-orange-50/50 border-b border-orange-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-orange-900">
                                                <i className="pi pi-check-circle"></i>
                                                <h4 className="m-0 font-bold">งานที่เสร็จสิ้น ({completedInternTasks.length})</h4>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <DataTable value={completedInternTasks} loading={loading} paginator rows={5} className="p-datatable-sm custom-orange-table">
                                                <Column field="date_report" header="วันที่" style={{ width: '9rem' }} sortable />
                                                <Column field="deviceName" header="อุปกรณ์/ชื่องาน" body={deviceTemplate} style={{ width: '15rem' }} sortable />
                                                <Column field="contribution_detail" header="สรุปผล" body={summaryTemplate} />
                                                <Column header="แก้ไข" body={(row) => <Button icon="pi pi-file-edit" text rounded onClick={() => openDetails({ ...row, type: 'intern' })} />} style={{ width: '5rem' }} />
                                            </DataTable>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* Modal รายละเอียดงาน */}
            <Dialog
                header={<div className="flex items-center gap-2 text-blue-700"><i className="pi pi-file-edit text-xl"></i><span className="font-black">รายละเอียดงาน</span></div>}
                visible={showModal}
                style={{ width: '95vw', maxWidth: '550px' }}
                onHide={() => setShowModal(false)}
                className="custom-blue-dialog"
                footer={
                    <div className="flex justify-between">
                        <Button label="ยกเลิกเข้าร่วมงานนี้" icon="pi pi-times" onClick={handleLeave} loading={loading} className="p-button-danger" />
                        <Button label="บันทึกข้อมูล" icon="pi pi-save" onClick={handleSaveNote} loading={loading} className="bg-blue-600 border-none px-6 rounded-xl shadow-lg shadow-blue-100" />
                        {selectedTask?.type === 'intern' && selectedTask?.status === 2 && (
                            <Button label="ปิดงาน" icon="pi pi-check-square" onClick={handleCloseTask} loading={loading} className="bg-green-600 border-none px-6 rounded-xl shadow-lg shadow-green-100" />
                        )}
                    </div>
                }
            >
                {selectedTask && (
                    <div className="flex flex-col gap-5 py-4">
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                            <p className="text-blue-900 font-bold text-lg leading-tight">{selectedTask.deviceName}</p>
                            <p className="text-slate-500 text-sm mt-1">{selectedTask.report}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-blue-600 ml-1">ขั้นตอนการดำเนินงานและการแก้ไข *</label>
                            <InputTextarea value={formData.contribution_detail} onChange={(e) => setFormData({ ...formData, contribution_detail: e.target.value })} rows={5} className="w-full rounded-2xl border-blue-100 p-4 shadow-inner text-sm" placeholder="อธิบายงานที่ทำ..." />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-500 ml-1">สิ่งที่ได้เรียนรู้จากงานนี้</label>
                            <InputTextarea value={formData.learning_outcome} onChange={(e) => setFormData({ ...formData, learning_outcome: e.target.value })} rows={2} className="w-full rounded-2xl border-blue-50 p-4 shadow-inner text-sm" placeholder="เทคนิคหรือความรู้เพิ่มเติม..." />
                        </div>
                    </div>
                )}
            </Dialog>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-blue-table .p-datatable-thead > tr > th { background-color: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; text-transform: uppercase !important; padding: 1rem !important; border-bottom: 2px solid #eff6ff !important; }
                .p-datatable-tbody > tr > td { border-bottom: 1px solid #f1f5f9 !important; padding: 1rem !important; }
                .custom-blue-calendar input { border-radius: 0.75rem !important; border: 1px solid #eff6ff !important; padding: 0.5rem 0.75rem !important; font-size: 13px !important; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .p-tooltip .p-tooltip-text { background: #1e293b !important; font-size: 11px !important; border-radius: 8px !important; padding: 10px !important; }
                
                /* Custom TabView Styling */
                .custom-luxury-tabs .p-tabview-nav { background: transparent !important; border: none !important; gap: 1rem !important; padding: 0.5rem !important; }
                .custom-luxury-tabs .p-tabview-nav li .p-tabview-nav-link { 
                    border-radius: 1.25rem !important; 
                    background: transparent !important; 
                    border: 1px solid #f1f5f9 !important; 
                    padding: 1rem 2rem !important;
                    font-weight: 700 !important;
                    color: #94a3b8 !important;
                    transition: all 0.3s ease !important;
                }
                .custom-luxury-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link { 
                    background: #2563eb !important; 
                    color: white !important; 
                    border-color: #2563eb !important;
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2) !important;
                }
                .custom-luxury-tabs .p-tabview-panels { background: transparent !important; padding: 0 !important; }
                
                /* Orange tables for intern tab */
                .custom-orange-table .p-datatable-thead > tr > th { background-color: #fffaf5 !important; color: #f97316 !important; border-bottom-color: #ffedd5 !important; font-size: 11px !important; padding: 1rem !important; }
            `}} />
        </div>
    );
}

export default MyTasks;
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
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, VerticalAlign, BorderStyle } from "docx";
import { saveAs } from "file-saver";
function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [internTasks, setInternTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    const [formData, setFormData] = useState({
        contribution_detail: '',
        learning_outcome: '',
        mentor_feedback: ''
    });

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

    // ✅ ฟังก์ชัน Export ข้อมูลเป็น Word (อิงตาม template แบบบันทึกภาระงาน)
    const exportToWord = async () => {
        // เลือกข้อมูลที่สร้างรีพอร์ตตาม Tab (ตอนนี้เป็น 1 = นักศึกษา หรือจะเลือกจาก internTasks ที่ completed ก็ได้)
        const tasksToExport = activeTab === 0 ? completedTasks : completedInternTasks;
        
        if (tasksToExport.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'แจ้งเตือน', detail: 'ไม่มีข้อมูลสำเร็จที่สามารถ Export ได้ในแท็บนี้' });
            return;
        }

        // เรียงวันที่จากเก่าไปใหม่ (ascending)
        const sortedTasks = [...tasksToExport].sort((a, b) => new Date(a.date_report) - new Date(b.date_report));

        // Group by date
        const tasksByDate = {};
        sortedTasks.forEach(task => {
            if (!tasksByDate[task.date_report]) {
                tasksByDate[task.date_report] = [];
            }
            tasksByDate[task.date_report].push(task);
        });

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No.", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "วัน/เดือน/ปี", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "รายละเอียดภาระงาน หน้าที่ การปฏิบัติงาน", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 50, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "หมายเหตุ", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER }),
                ]
            })
        ];

        let no = 1;
        for (const [date, tasks] of Object.entries(tasksByDate)) {
            const taskParagraphs = tasks.map((task, index) => {
                const detailText = task.contribution_detail ? String(task.contribution_detail).trim() : "";
                const titleText = task.deviceName ? String(task.deviceName).trim() : "";
                return new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${titleText} ${detailText ? "- " + detailText : ""}` })],
                    spacing: { before: 60, after: 60 }
                });
            });

            // หาหมายเหตุ (ดึงจาก learning_outcome ของงานในวันนั้นๆ)
            const remarks = tasks.filter(t => t.learning_outcome).map(t => t.learning_outcome).join(", ");

            tableRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(no) })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.TOP }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: date })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.TOP }),
                    new TableCell({ children: taskParagraphs, margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: remarks })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.TOP })
                ]
            }));
            no++;
        }

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            size: 32, // 16pt (1/2 pt units)
                            font: {
                                ascii: "TH SarabunPSK",
                                cs: "TH SarabunPSK",
                                eastAsia: "TH SarabunPSK",
                                hAnsi: "TH SarabunPSK",
                            },
                        },
                    },
                },
            },
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "แบบบันทึกภาระงาน", bold: true, size: 36 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "สัปดาห์ที่ 1 การปฏิบัติสหกิจศึกษา", bold: true, size: 32 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "นิสิตคณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏกำแพงเพชร", bold: true, size: 32 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        rows: tableRows,
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { 
                            top: { style: BorderStyle.NONE }, 
                            bottom: { style: BorderStyle.NONE }, 
                            left: { style: BorderStyle.NONE }, 
                            right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.NONE }, 
                            insideVertical: { style: BorderStyle.NONE } 
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: "" })],
                                        width: { size: 40, type: WidthType.PERCENTAGE },
                                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "ลงชื่อ / Signature.........................................." })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 120 } }),
                                            new Paragraph({ children: [new TextRun({ text: "(..........................................)" })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
                                            new Paragraph({ children: [new TextRun({ text: "ตำแหน่ง / Position .........................................." })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
                                            new Paragraph({ children: [new TextRun({ text: "วันที่ / Date.........................................." })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
                                            new Paragraph({ children: [new TextRun({ text: "หน่วยสหกิจศึกษา คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏกำแพงเพชร", size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 120 } })
                                        ],
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                                    })
                                ]
                            })
                        ]
                    })
                ],
            }],
        });

        try {
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `ภาระงาน_สหกิจศึกษา_${new Date().toISOString().split('T')[0]}.docx`);
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'ส่งออกไฟล์ Word เรียบร้อยแล้ว' });
        } catch (error) {
            console.error("Export Word Error:", error);
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถสร้างไฟล์ Word ได้' });
        }
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
                        <Calendar
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.value)}
                            placeholder="กรองตามวันที่"
                            dateFormat="yy-mm-dd"
                            showIcon
                            className="custom-blue-calendar w-44"
                            showButtonBar
                        />
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
                        <TabPanel header={<span><i className="pi pi-building mr-2"></i>งานเจ้าหน้าที่ ({pendingTasks.length})</span>}>
                            <div className="flex flex-col gap-6 pt-4">
                                {/* Staff Pending Table */}
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

                                {/* Staff History Table */}
                                <div className="bg-white rounded-4xl border border-blue-50 overflow-hidden shadow-sm">
                                    <div className="p-5 bg-slate-50 border-b border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-blue-900">
                                            <i className="pi pi-history"></i>
                                            <h4 className="m-0 font-bold">ประวัติงานเจ้าหน้าที่ ({completedTasks.length})</h4>
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
                            </div>
                        </TabPanel>

                        <TabPanel header={<span><i className="pi pi-user mr-2"></i>งานนักศึกษา ({pendingInternTasks.length})</span>}>
                            <div className="flex flex-col gap-6 pt-4">
                                {/* Intern Pending Table */}
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

                                {/* Intern History Table */}
                                <div className="bg-white rounded-4xl border border-orange-50 overflow-hidden shadow-sm">
                                    <div className="p-5 bg-orange-50/50 border-b border-orange-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-orange-900">
                                            <i className="pi pi-check-circle"></i>
                                            <h4 className="m-0 font-bold">ประวัติงานนักศึกษาที่ปิดแล้ว ({completedInternTasks.length})</h4>
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
                    <div className="flex gap-2 justify-end p-4">
                        <Button label="ยกเลิก" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text p-button-secondary" />
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
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">หัวข้อปัญหา</p>
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
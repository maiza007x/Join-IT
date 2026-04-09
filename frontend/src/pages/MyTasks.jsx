import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from '../services/api';
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

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    const [formData, setFormData] = useState({
        contribution_detail: '',
        learning_outcome: '',
        mentor_feedback: ''
    });

    const navigate = useNavigate();
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
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'โหลดข้อมูลไม่สำเร็จ' });
        } finally {
            setLoading(false);
        }
    }, [selectedDate, searchQuery]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);

    const pendingTasks = tasks.filter(t => !t.contribution_detail);
    const completedTasks = tasks.filter(t => t.contribution_detail);

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

    const timeTemplate = (rowData) => {
        if (!rowData.time_report) return "-";
        return <span className="font-bold text-blue-600">{rowData.time_report.substring(0, 5)} น.</span>;
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
            await API.put(`/tasks/contribution/${selectedTask.contribution_id}`, formData);
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
            setShowModal(false);
            fetchMyTasks();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'บันทึกไม่สำเร็จ' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f0f9ff] min-h-screen p-4 md:p-8 font-sans text-slate-700">
            <Toast ref={toast} />

            <div className="max-w-[1250px] mx-auto flex flex-col gap-6">

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
                    </div>
                </div>

                {/* ตารางงานที่รอ (Pending) */}
                <div className="bg-white rounded-[2.5rem] shadow-md shadow-blue-100/50 border border-white overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <i className="pi pi-clock text-xl"></i>
                            <h3 className="m-0 font-bold tracking-tight text-lg">รอยืนยันรายละเอียด ({pendingTasks.length})</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="hidden md:block">
                            <DataTable value={pendingTasks} loading={loading} rows={10} scrollable scrollDirection="horizontal" emptyMessage="ไม่พบรายการงาน" className="p-datatable-sm custom-blue-table">
                                <Column field="time_report" header="เวลา" body={timeTemplate} style={{ width: '7rem' }} sortable />
                                <Column field="date_report" header="วันที่" style={{ width: '9rem' }} className="text-slate-400" sortable />
                                <Column field="deviceName" header="อุปกรณ์" style={{ width: '15rem' }} className="font-bold text-slate-700" sortable />
                                <Column field="report" header="รายละเอียดปัญหา" className="text-slate-600" sortable />
                                <Column header="จัดการ" body={(row) => (
                                    <Button
                                        label="บันทึก"
                                        icon="pi pi-pencil"
                                        rounded
                                        className="py-1 px-3 text-[10px] font-bold bg-blue-600 border-none hover:bg-blue-700"
                                        style={{ height: '30px' }}
                                        onClick={() => openDetails(row)}
                                    />
                                )} style={{ textAlign: 'center', width: '7rem' }} />
                            </DataTable>
                        </div>
                        {/* Mobile Cards (Pending) */}
                        <div className="md:hidden flex flex-col gap-4">
                            {pendingTasks.length > 0 ? pendingTasks.map((task, i) => (
                                <div key={i} className="bg-white border border-blue-50 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <div className="flex items-center gap-2">
                                            <i className="pi pi-clock text-blue-500 text-xs"></i>
                                            <span className="font-bold text-blue-600 text-sm">{task.time_report ? task.time_report.substring(0, 5) + ' น.' : '-'}</span>
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">{task.date_report}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{task.deviceName}</h4>
                                        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">{task.report}</p>
                                    </div>
                                    <Button
                                        label="บันทึกข้อมูล"
                                        icon="pi pi-pencil"
                                        className="w-full h-9 p-button-sm bg-blue-600 hover:bg-blue-700 border-none rounded-xl text-xs font-bold mt-1 shadow-md shadow-blue-100"
                                        onClick={() => openDetails(task)}
                                    />
                                </div>
                            )) : <div className="text-center py-8 text-slate-400 text-sm font-medium">ไม่พบรายการงาน</div>}
                        </div>
                    </div>
                </div>

                {/* ตารางประวัติ (Completed) */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-blue-50 overflow-hidden">
                    <div className="p-6 bg-blue-50 flex items-center justify-between border-b border-blue-100">
                        <div className="flex items-center gap-3">
                            <i className="pi pi-check-circle text-blue-500 text-xl"></i>
                            <h3 className="m-0 font-bold text-blue-900 tracking-tight">ประวัติงานที่สำเร็จ ({completedTasks.length})</h3>
                        </div>
                        {/* ✅ ปุ่ม Export Excel แบบกะทัดรัด */}
                        <Button
                            label="Export Excel"
                            icon="pi pi-file-excel"
                            onClick={exportToExcel}
                            className="p-button-sm bg-emerald-600 border-none rounded-xl text-[10px] h-8 px-3 shadow-md hover:bg-emerald-700 transition-all"
                        />
                    </div>
                    <div className="p-4">
                        <div className="hidden md:block">
                            <DataTable
                                value={completedTasks}
                                loading={loading}
                                paginator
                                rows={5}
                                scrollable 
                                scrollDirection="horizontal"
                                emptyMessage="ไม่พบประวัติงาน"
                                className="p-datatable-sm custom-blue-table"
                            >
                                <Column field="date_report" header="วันที่" style={{ width: '9rem' }} className="text-slate-400" sortable />
                                <Column field="deviceName" header="อุปกรณ์" style={{ width: '13rem' }} className="text-slate-700 font-bold" sortable />
                                <Column field="contribution_detail" header="สรุปการช่วยงาน" body={summaryTemplate} className="hidden md:table-cell" style={{ width: '20rem' }} sortable />

                                <Column field="report" header="ปัญหาที่แจ้ง" className="text-slate-500 italic text-xs" style={{ width: '12rem' }} sortable />
                                <Column header="สถานะ" body={() => <Tag value="สำเร็จ" className="bg-green-100 text-green-600 font-bold px-3 py-1" rounded />} style={{ width: '7rem', textAlign: 'center' }} />
                                <Column header="แก้ไข" body={(row) => (
                                    <Button
                                        icon="pi pi-file-edit"
                                        rounded
                                        text
                                        severity="info"
                                        className="w-8 h-8 p-0"
                                        onClick={() => openDetails(row)}
                                    />
                                )} style={{ textAlign: 'center', width: '5rem' }} />
                            </DataTable>
                        </div>
                        {/* Mobile Cards (Completed) */}
                        <div className="md:hidden flex flex-col gap-4">
                            {completedTasks.length > 0 ? completedTasks.map((task, i) => (
                                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{task.date_report}</span>
                                        <Tag value="สำเร็จ" className="bg-green-100 text-green-600 font-bold px-2 py-0.5 text-[10px]" rounded />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1 pr-8 line-clamp-1">{task.deviceName}</h4>
                                    <p className="text-slate-400 text-[10px] italic line-clamp-1 mb-3">{task.report}</p>
                                    
                                    <div className="bg-blue-50/50 p-3 rounded-xl text-xs text-slate-600 line-clamp-2 border border-blue-50/50 leading-relaxed">
                                        <span className="font-bold text-blue-600 mr-1">สรุปการทำงาน:</span> 
                                        {task.contribution_detail}
                                    </div>
                                    
                                    <Button
                                        icon="pi pi-file-edit"
                                        rounded
                                        text
                                        severity="info"
                                        className="absolute top-9 right-2 w-8 h-8 bg-blue-50/50 hover:bg-blue-100 transition-all text-blue-600"
                                        onClick={() => openDetails(task)}
                                    />
                                </div>
                            )) : <div className="text-center py-8 text-slate-400 text-sm font-medium">ไม่พบประวัติงาน</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal รายละเอียดงาน */}
            <Dialog
                header={<div className="flex items-center gap-2 text-blue-700"><i className="pi pi-file-edit text-xl"></i><span className="font-black">รายละเอียดงาน</span></div>}
                visible={showModal}
                style={{ width: '95vw', maxWidth: '550px' }}
                onHide={() => setShowModal(false)}
                className="custom-blue-dialog"
                footer={<div className="flex gap-2 justify-end p-4"><Button label="ยกเลิก" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text p-button-secondary" /><Button label="บันทึกข้อมูล" icon="pi pi-save" onClick={handleSaveNote} loading={loading} className="bg-blue-600 border-none px-6 rounded-xl shadow-lg shadow-blue-100" /></div>}
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
            `}} />
        </div>
    );
}

export default MyTasks;
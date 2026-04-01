import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from '../services/api'; 
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [note, setNote] = useState(""); 
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useRef(null);

    // 1. ดึงเฉพาะงานที่เราเข้าร่วม
    const fetchMyTasks = async () => {
        setLoading(true);
        try {
            const res = await API.get('/tasks/my-tasks'); 
            setTasks(res.data.tasks || []);
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'โหลดข้อมูลไม่สำเร็จ' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyTasks(); }, []);

    // 2. เมื่อกดดูรายละเอียดและบันทึก
    const openDetails = (task) => {
        setSelectedTask(task);
        setNote(task.contribution_note || ""); 
        setShowModal(true);
    };

    const handleSaveNote = async () => {
        try {
            await API.put(`/tasks/contribution/${selectedTask.contribution_id}`, {
                note: note
            });
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกผลการเรียนรู้แล้ว' });
            setShowModal(false);
            fetchMyTasks(); 
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'บันทึกไม่สำเร็จ' });
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-700">
            <Toast ref={toast} />
            
            <div className="max-w-[1250px] mx-auto">
                
                {/* 🏰 Header Luxury Style */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-[2rem] shadow-sm border border-white">
                    <div className="flex items-center gap-4">
                        
                        {/* ✅ ปุ่มย้อนกลับไปหน้าหลัก */}
                        <button 
                            onClick={() => navigate("/tasks")} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all border border-slate-100 group"
                            title="กลับหน้าหลัก"
                        >
                            <i className="pi pi-arrow-left font-bold group-hover:-translate-x-1 transition-transform"></i>
                        </button>

                        <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 p-3 rounded-2xl shadow-xl shadow-indigo-100">
                            <i className="pi pi-user-edit text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-[#1e293b] tracking-tight leading-none">งานของฉัน</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">My Contribution Records</p>
                        </div>
                    </div>

                    <div className="hidden md:block">
                         <Tag value={`${tasks.length} รายการที่บันทึกแล้ว`} severity="info" rounded className="px-4 py-2 bg-indigo-50 text-indigo-600 border-none font-bold" />
                    </div>
                </div>

                {/* 📊 Main Data Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
                    <div className="p-7 flex items-center justify-between bg-slate-900">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-indigo-500 rounded-full"></div>
                            <div>
                                <h3 className="m-0 font-bold text-white text-xl tracking-tight">ประวัติการทำงาน</h3>
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Personal learning & contribution log</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <DataTable 
                            value={tasks} 
                            loading={loading}
                            paginator 
                            rows={10} 
                            emptyMessage="ยังไม่มีประวัติการทำงาน" 
                            className="p-datatable-sm custom-luxury-table"
                            rowHover
                        >
                            <Column field="date_report" header="วันที่" style={{ width: '10rem' }} className="font-bold text-slate-400" />
                            <Column field="deviceName" header="อุปกรณ์" style={{ width: '15rem' }} className="font-bold text-slate-700" />
                            <Column field="report" header="รายละเอียดปัญหา" className="text-slate-600 leading-relaxed" />
                            <Column header="จัดการ" body={(row) => (
                                <Button 
                                    label="บันทึกงาน" 
                                    icon="pi pi-pencil" 
                                    rounded
                                    className="px-4 py-2 text-[10px] font-bold border-none bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                                    onClick={() => openDetails(row)} 
                                />
                            )} style={{ textAlign: 'center', width: '10rem' }} />
                        </DataTable>
                    </div>
                </div>
            </div>

            {/* 📝 Modal รายละเอียดและบันทึกงาน */}
            <Dialog 
                header={
                    <div className="flex items-center gap-3">
                        <i className="pi pi-file-edit text-indigo-500"></i>
                        <span className="font-black text-slate-700">บันทึกสิ่งที่ได้เรียนรู้</span>
                    </div>
                } 
                visible={showModal} 
                style={{ width: '90vw', maxWidth: '500px' }} 
                onHide={() => setShowModal(false)}
                draggable={false}
                resizable={false}
                className="custom-dialog"
                footer={
                    <div className="flex gap-2 justify-end p-3">
                        <Button label="ยกเลิก" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text p-button-secondary font-bold" />
                        <Button label="บันทึกข้อมูล" icon="pi pi-check" onClick={handleSaveNote} className="bg-indigo-600 border-none font-bold px-6 rounded-xl shadow-lg shadow-indigo-100" />
                    </div>
                }
            >
                {selectedTask && (
                    <div className="flex flex-col gap-5 py-2">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ปัญหาที่พบ</p>
                            <p className="text-slate-700 font-medium leading-relaxed">{selectedTask.report}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2 px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">บันทึกสิ่งที่เรียนรู้ / การแก้ไข</label>
                            <InputTextarea 
                                value={note} 
                                onChange={(e) => setNote(e.target.value)} 
                                rows={6} 
                                placeholder="พิมพ์รายละเอียดการทำงานหรือสิ่งที่คุณได้เรียนรู้จากเคสนี้..." 
                                className="w-full rounded-2xl border-slate-200 p-4 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-600" 
                            />
                        </div>
                    </div>
                )}
            </Dialog>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-luxury-table .p-datatable-thead > tr > th {
                    background-color: #fafafa !important;
                    color: #94a3b8 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.15em !important;
                    border-bottom: 2px solid #f8fafc !important;
                    padding: 1.5rem 1rem !important;
                }
                .p-datatable-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 1.5rem 1rem !important;
                }
                .p-paginator {
                    border: none !important;
                    padding: 1.5rem !important;
                }
                .custom-dialog .p-dialog-header {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 1.5rem !important;
                    border-radius: 2rem 2rem 0 0 !important;
                }
                .custom-dialog .p-dialog-content {
                    padding: 1.5rem !important;
                }
                .custom-dialog .p-dialog-footer {
                    border-top: 1px solid #f1f5f9 !important;
                    padding: 1rem 1.5rem !important;
                    border-radius: 0 0 2rem 2rem !important;
                }
            `}} />
        </div>
    );
}

export default MyTasks;
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
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        contribution_detail: '',
        learning_outcome: '',
        mentor_feedback: ''
    });

    const navigate = useNavigate();
    const toast = useRef(null);

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

    // กรองข้อมูลแยก 2 ตาราง
    const pendingTasks = tasks.filter(t => !t.contribution_detail);
    const completedTasks = tasks.filter(t => t.contribution_detail);

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
        try {
            await API.put(`/tasks/contribution/${selectedTask.contribution_id}`, formData);
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
            setShowModal(false);
            fetchMyTasks(); 
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'บันทึกไม่สำเร็จ' });
        }
    };

    return (
        <div className="bg-[#f0f9ff] min-h-screen p-4 md:p-8 font-sans text-slate-700">
            <Toast ref={toast} />
            
            <div className="max-w-[1250px] mx-auto flex flex-col gap-8">
                {/* Header โทนฟ้าขาว */}
                <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-blue-100">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate("/tasks")} 
                            className="w-10 h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-100"
                        >
                            <i className="pi pi-arrow-left font-bold"></i>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-blue-900 leading-none">งานของฉัน</h1>
                            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mt-1">My Contribution Records</p>
                        </div>
                    </div>
                    <Tag value={`${completedTasks.length} รายการที่บันทึกแล้ว`} className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold border-none" />
                </div>

                {/* --- ตารางบน: งานที่รอการบันทึก (โทนสีฟ้าสดใส) --- */}
                <div className="bg-white rounded-[2.5rem] shadow-md shadow-blue-100/50 border border-white overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="pi pi-clock text-white text-xl"></i>
                            <h3 className="m-0 font-bold text-white tracking-tight">รายการงานที่รอการบันทึก ({pendingTasks.length})</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        <DataTable value={pendingTasks} loading={loading} rows={5} emptyMessage="ไม่มีงานค้างในขณะนี้" className="p-datatable-sm custom-blue-table">
                            <Column field="date_report" header="วันที่" style={{ width: '10rem' }} className="font-bold text-blue-400" />
                            <Column field="deviceName" header="อุปกรณ์" style={{ width: '15rem' }} className="font-bold text-slate-700" />
                            <Column field="report" header="รายละเอียดปัญหา" className="text-slate-600" />
                            <Column header="จัดการ" body={(row) => (
                                <Button 
                                    label="บันทึกงาน" 
                                    icon="pi pi-pencil" 
                                    rounded 
                                    className="px-4 py-2 text-[11px] font-bold bg-blue-600 border-none hover:bg-blue-700 shadow-md shadow-blue-100" 
                                    onClick={() => openDetails(row)} 
                                />
                            )} style={{ textAlign: 'center', width: '10rem' }} />
                        </DataTable>
                    </div>
                </div>

                {/* --- ตารางล่าง: งานที่บันทึกเรียบร้อยแล้ว (โทนสีขาว-ฟ้าอ่อน) --- */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-blue-50 overflow-hidden">
                    <div className="p-6 bg-blue-50 flex items-center gap-3 border-bottom border-blue-100">
                        <i className="pi pi-check-circle text-blue-500 text-xl"></i>
                        <h3 className="m-0 font-bold text-blue-900 tracking-tight">ประวัติการบันทึกงานที่เสร็จสมบูรณ์ ({completedTasks.length})</h3>
                    </div>
                    <div className="p-4">
                        <DataTable value={completedTasks} loading={loading} paginator rows={5} emptyMessage="ยังไม่มีประวัติ" className="p-datatable-sm custom-blue-table">
                            <Column field="date_report" header="วันที่" style={{ width: '10rem' }} className="text-slate-400" />
                            <Column field="deviceName" header="อุปกรณ์" style={{ width: '15rem' }} className="text-slate-700" />
                            <Column field="report" header="รายละเอียดปัญหา" className="text-slate-500" />
                            <Column header="สถานะ" body={() => (
                                <Tag value="บันทึกเสร็จสิ้น" severity="success" className="bg-green-50 text-green-600 border-green-100 font-bold" />
                            )} style={{ width: '10rem', textAlign: 'center' }} />
                            <Column header="แก้ไข" body={(row) => (
                                <Button 
                                    icon="pi pi-refresh" 
                                    rounded 
                                    className="p-button-text p-button-info" 
                                    onClick={() => openDetails(row)} 
                                    title="แก้ไขข้อมูล"
                                />
                            )} style={{ textAlign: 'center', width: '5rem' }} />
                        </DataTable>
                    </div>
                </div>
            </div>

            {/* Modal บันทึกงาน */}
            <Dialog 
                header={
                    <div className="flex items-center gap-2 text-blue-700">
                        <i className="pi pi-form text-xl"></i>
                        <span className="font-black">รายละเอียดการทำงาน</span>
                    </div>
                } 
                visible={showModal} 
                style={{ width: '95vw', maxWidth: '550px' }} 
                onHide={() => setShowModal(false)}
                className="custom-blue-dialog"
                footer={
                    <div className="flex gap-2 justify-end p-3">
                        <Button label="ปิด" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text p-button-secondary font-bold" />
                        <Button label="บันทึกข้อมูล" icon="pi pi-save" onClick={handleSaveNote} className="bg-blue-600 border-none font-bold px-6 rounded-xl" />
                    </div>
                }
            >
                {selectedTask && (
                    <div className="flex flex-col gap-5 py-2">
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">ปัญหาที่ได้รับมอบหมาย</p>
                            <p className="text-blue-900 font-medium">{selectedTask.report}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-blue-600 ml-1">รายละเอียดสิ่งที่ได้ทำ *</label>
                            <InputTextarea 
                                value={formData.contribution_detail} 
                                onChange={(e) => setFormData({...formData, contribution_detail: e.target.value})} 
                                rows={4} 
                                className="w-full rounded-2xl border-blue-100 focus:border-blue-400 p-4" 
                                placeholder="อธิบายขั้นตอนการแก้ไขงานของคุณ..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-500 ml-1">ความรู้ที่ได้รับ (ถ้ามี)</label>
                            <InputTextarea 
                                value={formData.learning_outcome} 
                                onChange={(e) => setFormData({...formData, learning_outcome: e.target.value})} 
                                rows={2} 
                                className="w-full rounded-2xl border-blue-50 p-4" 
                                placeholder="เทคนิคใหม่ๆ หรือสิ่งที่ได้เรียนรู้จากงานนี้"
                            />
                        </div>
                    </div>
                )}
            </Dialog>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-blue-table .p-datatable-thead > tr > th {
                    background-color: #f8fafc !important;
                    color: #64748b !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    padding: 1.2rem 1rem !important;
                    border-bottom: 2px solid #eff6ff !important;
                }
                .p-datatable-tbody > tr > td {
                    border-bottom: 1px solid #eff6ff !important;
                    padding: 1.2rem 1rem !important;
                }
                .custom-blue-dialog .p-dialog-header {
                    border-radius: 2rem 2rem 0 0 !important;
                    border-bottom: 1px solid #eff6ff !important;
                }
                .custom-blue-dialog .p-dialog-footer {
                    border-radius: 0 0 2rem 2rem !important;
                    border-top: 1px solid #eff6ff !important;
                }
            `}} />
        </div>
    );
}

export default MyTasks;
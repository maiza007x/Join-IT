import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useRef(null);

    // ✅ ดึงข้อมูลงาน
    const fetchTasks = async (date = selectedDate, query = searchQuery) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formattedDate = date instanceof Date ? date.toLocaleDateString('en-CA') : '';
            const response = await axios.get(`http://10.0.0.27:5000/api/tasks/tasks_collab`, {
                params: { date: formattedDate, q: query },
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(response.data.tasks || []);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูลงานล้มเหลว' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleJoin = async (taskId) => {
        setActionLoading(taskId);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://10.0.0.27:5000/api/tasks/join`, 
                { task_staff_id: taskId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'เข้าร่วมงานเรียบร้อย', life: 2000 });
            fetchTasks(); 
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถเข้าร่วมงานได้' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeave = async (taskId) => {
        setActionLoading(taskId);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://10.0.0.27:5000/api/tasks/leave/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.current.show({ severity: 'warn', summary: 'ยกเลิก', detail: 'ยกเลิกการมีส่วนร่วมแล้ว', life: 2000 });
            fetchTasks();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถยกเลิกได้' });
        } finally {
            setActionLoading(null);
        }
    };

    const confirmJoin = (taskId) => {
        confirmDialog({
            message: 'ต้องการมีส่วนร่วมกับงานนี้ใช่หรือไม่?',
            header: 'ยืนยันการเข้าร่วม',
            icon: 'pi pi-user-plus',
            acceptClassName: 'p-button-info rounded-xl px-4',
            rejectClassName: 'p-button-text rounded-xl px-4',
            accept: () => handleJoin(taskId)
        });
    };

    const confirmLeave = (taskId) => {
        confirmDialog({
            message: 'คุณต้องการยกเลิกการมีส่วนร่วมจากงานนี้ใช่หรือไม่?',
            header: 'ยืนยันการยกเลิก',
            icon: 'pi pi-exclamation-circle',
            acceptClassName: 'p-button-danger rounded-xl px-4',
            rejectClassName: 'p-button-text rounded-xl px-4',
            accept: () => handleLeave(taskId)
        });
    };

    const internTemplate = (rowData) => (
        <div className="flex flex-wrap gap-1">
            {rowData.interns && rowData.interns.length > 0 ? (
                rowData.interns.map((name, index) => (
                    <Tag key={index} value={name} rounded className="px-2 text-[10px] bg-blue-50 text-blue-600 border-none font-bold" />
                ))
            ) : (
                <span className="text-slate-300 text-[10px] italic">ยังไม่มีคนช่วย</span>
            )}
        </div>
    );

    const actionTemplate = (rowData) => {
        const isJoined = rowData.isContributedByMe;
        const isLoading = actionLoading === rowData.id;
        return (
            <Button
                label={isJoined ? "ยกเลิก" : "มีส่วนร่วม"}
                icon={isJoined ? "pi pi-times" : "pi pi-plus"}
                rounded
                severity={isJoined ? "danger" : "info"}
                loading={isLoading}
                className={`px-4 py-2 text-[10px] font-bold border-none transition-all ${isJoined ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100' : 'bg-[#1e293b] hover:bg-slate-700 shadow-lg shadow-slate-200'}`}
                onClick={() => isJoined ? confirmLeave(rowData.id) : confirmJoin(rowData.id)}
            />
        );
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-700">
            <Toast ref={toast} />
            <ConfirmDialog />
            
            <div className="max-w-[1250px] mx-auto py-8 px-4">
                
                {/* 🔍 Filter & Search Bar */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 mb-8">
                    <div className="flex flex-wrap gap-5 items-end">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ค้นหาตามวันที่</span>
                            <Calendar value={selectedDate} onChange={(e) => setSelectedDate(e.value)} dateFormat="yy-mm-dd" showIcon className="w-full md:w-52 custom-calendar" />
                        </div>
                        <div className="flex flex-col gap-2 flex-grow">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คำค้นหา (ปัญหา, อุปกรณ์, แผนก)</span>
                            <div className="relative w-full">
                                <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 text-sm" />
                                <InputText 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    placeholder="       พิมพ์เพื่อค้นหา..." 
                                    className="w-full rounded-2xl border-slate-100 bg-slate-50/50 pl-11 py-3 focus:ring-2 focus:ring-blue-100 transition-all text-sm" 
                                />
                            </div>
                        </div>
                        <Button label="ค้นหาข้อมูล" icon="pi pi-search" className="rounded-2xl px-8 bg-blue-600 border-none font-bold h-[48px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all" onClick={() => fetchTasks()} loading={loading} />
                    </div>
                </div>

                {/* Main Data Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
                    <div className="p-7 flex items-center justify-between bg-slate-900">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="m-0 font-bold text-white text-xl tracking-tight">งานวันนี้</h3>
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Real-time data synchronization</p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-5 py-2 rounded-2xl text-white font-black text-sm border border-white/5 backdrop-blur-sm">
                            {tasks.length} รายการพบแล้ว
                        </div>
                    </div>

                    <div className="p-4">
                        <DataTable 
                            value={tasks} 
                            loading={loading}
                            paginator 
                            rows={10} 
                            emptyMessage="ไม่พบรายการงานที่ตรงตามเงื่อนไข" 
                            className="p-datatable-sm custom-luxury-table"
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                            currentPageReportTemplate="{first}-{last} of {totalRecords}"
                        >
                            <Column field="id" header="#" headerStyle={{width: '4rem'}} bodyStyle={{fontWeight: 'bold', color: '#cbd5e1'}} />
                            <Column field="time_report" header="เวลา" style={{ width: '7rem' }} className="font-medium text-slate-500" />
                            <Column header="อุปกรณ์ / แผนก" body={(row) => (
                                <div className="py-1">
                                    <div className="font-bold text-slate-700 text-base">{row.deviceName}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <i className="pi pi-map-marker text-blue-400 text-[10px]"></i>
                                        <span className="text-[11px] text-slate-400 font-bold uppercase">{row.department}</span>
                                    </div>
                                </div>
                            )} />
                            <Column field="report" header="รายละเอียดปัญหา" className="text-slate-600 leading-relaxed" style={{ maxWidth: '25rem' }} />
                            <Column field="username" header="เจ้าหน้าที่" body={(row) => <span className="text-slate-500 font-semibold italic">@{row.username}</span>} />
                            <Column header="ผู้มีส่วนร่วม" body={internTemplate} style={{ width: '13rem' }} />
                            <Column header="จัดการ" body={actionTemplate} style={{ textAlign: 'center', width: '9rem' }} />
                        </DataTable>
                    </div>
                </div>
            </div>

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
                .p-datatable-tbody > tr:hover {
                    background-color: #fcfdfe !important;
                }
                .custom-calendar input {
                    border-radius: 1.25rem !important;
                    border: 1px solid #f1f5f9 !important;
                    background: #f8fafc !important;
                    padding: 0.75rem 1rem !important;
                    font-weight: 600;
                    color: #475569;
                }
                .p-paginator {
                    border: none !important;
                    padding: 2rem !important;
                    background: transparent !important;
                }
                .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
                    background: #2563eb !important;
                    color: white !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }
            `}} />
        </div>
    );
}

export default Tasks;
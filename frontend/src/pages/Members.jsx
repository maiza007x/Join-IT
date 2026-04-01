import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

function Members() {
    const navigate = useNavigate();
    
    // ข้อมูลตัวอย่างสำหรับแสดงผล (อิงจากภาพใหม่ของคุณ)
    const [users] = useState([
        { id: 1, username: 'potto', name: 'อธิรญา จำปาวัน', role: 'ผู้ดูแลระบบ', verified: 'ยืนยันแล้ว', created_at: '13/03/2026', status: 'Active' },
        { id: 2, username: 'user1', name: 'พริมลกา เตือนแก้ว', role: 'ผู้ดูแลระบบ', verified: 'ยืนยันแล้ว', created_at: '12/03/2026', status: 'Inactive' },
        { id: 3, username: 'user3', name: 'user3', role: 'ผู้ดูแลระบบ', verified: 'ยืนยันแล้ว', created_at: '13/03/2026', status: 'Active' },
        { id: 4, username: 'user3', name: 'user3', role: 'พยาบาล', verified: 'ยังไม่ยืนยัน', created_at: '23/03/2026', status: 'Active' },
        { id: 6, username: 'user4', name: 'user4', role: 'พยาบาล', verified: 'ยังไม่ยืนยัน', created_at: '23/03/2026', status: 'Active' },
        { id: 7, username: 'user6', name: 'user6', role: 'พยาบาล', verified: 'ยังไม่ยืนยัน', created_at: '23/03/2026', status: 'Inactive' },
        { id: 8, username: 'user7', name: 'user7', role: 'พยาบาล', verified: 'ยังไม่ยืนยัน', created_at: '23/03/2026', status: 'Active' },
        { id: 10, username: 'user8', name: 'user4', role: 'พยาบาล', verified: 'ยังไม่ยืนยัน', created_at: '23/03/2026', status: 'Active' }
    ]);

    return (
        <div className="bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-700">
            <div className="max-w-[1250px] mx-auto">
                
                {/* 🏰 Header Luxury */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-[2rem] shadow-sm border border-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3 rounded-2xl shadow-xl shadow-blue-100 cursor-pointer" onClick={() => navigate("/tasks")}>
                            <i className="pi pi-arrow-left text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-[#1e293b] tracking-tight leading-none">จัดการสมาชิก</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">User Management</p>
                        </div>
                    </div>
                    
                    <Button label="เพิ่มผู้ใช้" icon="pi pi-user-plus" className="rounded-2xl px-6 bg-blue-600 border-none font-bold h-[48px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all" />
                </div>

                {/* 📋 ตารางรายชื่อสมาชิก */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
                    <div className="p-7 flex items-center justify-between bg-slate-900">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="m-0 font-bold text-white text-xl tracking-tight">ดูสมาชิกทั้งหมด</h3>
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Real-time data synchronization</p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-5 py-2 rounded-2xl text-white font-black text-sm border border-white/5 backdrop-blur-sm">
                            แสดงผล {users.length} สมาชิก
                        </div>
                    </div>

                    <div className="p-4">
                        <DataTable 
                            value={users} 
                            paginator 
                            rows={10} 
                            className="p-datatable-sm custom-luxury-table" 
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                            currentPageReportTemplate="1-10 of {totalRecords}"
                        >
                            <Column field="id" header="#" style={{width: '3rem'}} bodyStyle={{fontWeight: 'bold', color: '#cbd5e1'}} />
                            <Column field="username" header="Username ↑↓" sortable />
                            <Column field="name" header="ชื่อ ↑↓" sortable />
                            <Column field="role" header="บทบาท ↑↓" body={(row) => (
                                <Tag value={row.role} className={`px-3 py-1 text-[11px] font-bold border-none ${row.role === 'ผู้ดูแลระบบ' ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'}`} />
                            )} />
                            <Column field="verified" header="ยืนยันการใช้งาน ↑↓" body={(row) => (
                                <Tag value={row.verified} className={`px-3 py-1 text-[11px] font-bold border-none ${row.verified === 'ยืนยันแล้ว' ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'}`} />
                            )} />
                            <Column field="created_at" header="วันที่สร้าง ↑↓" />
                            <Column field="status" header="สถานะ" body={(row) => (
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${row.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm font-semibold">{row.status}</span>
                                </div>
                            )} />
                            <Column header="จัดการ" body={() => (
                                <div className="flex gap-2">
                                    <Button icon="pi pi-cog" rounded className="p-button-info p-button-sm bg-blue-500 border-none" />
                                    <Button icon="pi pi-trash" rounded className="p-button-danger p-button-sm bg-red-500 border-none" />
                                </div>
                            )} style={{ width: '8rem' }} />
                        </DataTable>
                    </div>
                </div>

            </div>

            {/* Custom Style ให้เหมือนกับหน้า Tasks */}
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
                .p-paginator {
                    border: none !important;
                    padding: 2rem !important;
                    background: transparent !important;
                }
                .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
                    background: #2563eb !important;
                    color: white !important;
                    border-radius: 12px !important;
                }
            `}} />
        </div>
    );
}

// ⚠️ สำคัญมาก! บรรทัดนี้แหละครับที่ระบบแจ้งเตือนว่าหายไป
export default Members;
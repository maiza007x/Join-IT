import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../context/AuthContext';
function Members() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const { isAdmin } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    // 1. ดึงข้อมูลสมาชิกจาก Node.js
    const fetchUsers = async () => {
        try {
            setLoading(true);
            // 🚀 ยิงหา Node.js โดยใช้ api service ที่ตั้งค่า baseURL ไว้แล้ว
            const response = await api.get("/users/all");

            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            // ถ้า Token หมดอายุ (401) อาจจะเด้งไปหน้า Login
            if (error.response && error.response.status === 401) {
                alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. ฟังก์ชันการลบสมาชิก
    const handleDeleteUser = async (id, username) => {
        if (!isAdmin) {
            alert("คุณไม่มีสิทธิ์ลบผู้ใช้งานระบบ (สิทธิ์เฉพาะแอดมินเท่านั้น)");
            return;
        }

        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${username}" ?`)) {
            try {
                const response = await api.delete(`/users/${id}`);

                if (response.data.status === "success") {
                    alert("ลบผู้ใช้สำเร็จ!");
                    // อัปเดต UI หน้าบ้านทันทีโดยไม่ต้อง Refresh
                    setUsers(users.filter((user) => user.id !== id));
                }
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการลบ:", error);
                alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
            }
        }
    };

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

                    <Button
                        label="เพิ่มผู้ใช้"
                        icon="pi pi-user-plus"
                        disabled={!isAdmin}
                        className={`rounded-2xl px-6 border-none font-bold h-[48px] shadow-lg shadow-blue-100 transition-all ${isAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                    />
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
                            loading={loading}
                            className="p-datatable-sm custom-luxury-table"
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                            currentPageReportTemplate="1-10 of {totalRecords}"
                        >
                            <Column field="id" header="#" style={{ width: '3rem' }} bodyStyle={{ fontWeight: 'bold', color: '#cbd5e1' }} />
                            <Column field="username" header="Username ↑↓" sortable />
                            <Column field="full_name" header="ชื่อ ↑↓" sortable />
                            <Column field="role" header="บทบาท ↑↓" body={(row) => (
                                <Tag value={row.role} className={`px-3 py-1 text-[11px] font-bold border-none ${row.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'}`} />
                            )} />
                            <Column field="updated_at" header="วันที่อัปเดตล่าสุด ↑↓" />

                            <Column header="จัดการ" body={(row) => (
                                <div className="flex gap-2">
                                    <Button icon="pi pi-cog" rounded className="p-button-info p-button-sm bg-blue-500 border-none" />
                                    <Button
                                        icon="pi pi-trash"
                                        rounded
                                        className={`p-button-danger p-button-sm border-none ${isAdmin ? 'bg-red-500' : 'bg-slate-300 cursor-not-allowed'}`}
                                        onClick={() => handleDeleteUser(row.id, row.username)}
                                    />
                                </div>
                            )} style={{ width: '8rem' }} />
                        </DataTable>
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
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

export default Members;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';

function Members() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // เก็บข้อมูลผู้ใช้จริง
    const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล

    // --- 1. ฟังก์ชันดึงข้อมูลจาก API พร้อมส่ง Token ---
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // ดึง Token จากเครื่อง
            const response = await axios.get('http://10.0.0.27:5000/api/users/all', {
                headers: { 
                    Authorization: `Bearer ${token}` // ส่ง Token ไปใน Header
                }
            });
            setUsers(response.data); // บันทึกข้อมูลลง State
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

    // --- 2. เรียกใช้ครั้งแรกเมื่อเข้าหน้าจอ ---
    useEffect(() => {
        fetchUsers();
    }, []);

    // Template สำหรับบทบาท
    const roleBodyTemplate = (rowData) => {
        const isAdmin = rowData.role === 'ผู้ดูแลระบบ' || rowData.role === 'admin';
        return (
            <Tag 
                value={rowData.role} 
                className={`px-3 py-1 rounded-lg font-semibold border-none shadow-sm ${isAdmin ? 'bg-purple-500 text-white' : 'bg-sky-500 text-white'}`} 
            />
        );
    };

    // Template สำหรับการยืนยัน (เช็คจาก 1/0 หรือ ข้อความ)
    const verifiedBodyTemplate = (rowData) => {
        const isVerified = rowData.verified === 1 || rowData.verified === 'ยืนยันแล้ว';
        return (
            <Tag 
                value={isVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'} 
                className={`px-3 py-1 rounded-lg font-semibold border-none shadow-sm ${isVerified ? 'bg-emerald-500' : 'bg-slate-400'} text-white`} 
            />
        );
    };

    return (
        <div className="min-h-screen bg-[#e2f3ff] p-0 font-sans text-slate-600">
            {/* 🟦 Header Section */}
            <div className="flex justify-between items-center px-8 py-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-blue-600 shadow-md hover:bg-blue-50 transition-all border border-blue-100"
                    >
                        <i className="pi pi-chevron-left font-bold"></i>
                    </button>
                    <h1 className="text-2xl font-extrabold text-slate-700 tracking-tight">จัดการผู้ใช้</h1>
                </div>

                <div className="flex gap-3">
                    <Button 
                        label="เพิ่มผู้ใช้" 
                        icon="pi pi-user-plus" 
                        className="bg-blue-600 border-none px-5 py-2.5 text-sm font-bold shadow-lg rounded-xl" 
                    />
                    <Button 
                        icon="pi pi-refresh" 
                        onClick={fetchUsers} // กดเพื่อดึงข้อมูลใหม่จาก DB
                        className="bg-white text-blue-600 border-blue-100 p-2.5 shadow-md rounded-xl border" 
                        loading={loading}
                    />
                </div>
            </div>

            {/* 📋 Table Container */}
            <div className="mx-8 mb-10 bg-white rounded-[1.5rem] shadow-xl overflow-hidden border border-white min-h-[400px]">
                {loading ? (
                    /* แสดงตัวโหลดขณะรอ API */
                    <div className="flex flex-col justify-center items-center h-64 gap-3">
                        <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="6" />
                        <span className="text-slate-400 font-medium">กำลังดึงข้อมูล...</span>
                    </div>
                ) : (
                    <DataTable 
                        value={users} 
                        paginator 
                        rows={10}
                        className="p-datatable-sm custom-modern-table"
                        rowHover
                        emptyMessage="ไม่พบข้อมูลผู้ใช้งาน"
                    >
                        <Column field="username" header="Username ↑↓" sortable className="pl-6" headerClassName="bg-[#f8fafc] text-slate-500 font-bold py-4 pl-6" />
                        <Column field="name" header="ชื่อ ↑↓" sortable headerClassName="bg-[#f8fafc] text-slate-500 font-bold py-4" />
                        <Column field="role" header="บทบาท ↑↓" sortable body={roleBodyTemplate} className="text-center" headerClassName="bg-[#f8fafc] text-slate-500 font-bold py-4 text-center" />
                        <Column field="verified" header="ยืนยันการใช้งาน ↑↓" sortable body={verifiedBodyTemplate} className="text-center" headerClassName="bg-[#f8fafc] text-slate-500 font-bold py-4 text-center" />
                        <Column field="created_at" header="วันที่สร้าง ↑↓" sortable className="text-center" headerClassName="bg-[#f8fafc] text-slate-500 font-bold py-4 text-center" />
                        
                        <Column header="จัดการ" body={() => (
                            <div className="flex gap-4 justify-center pr-6">
                                <i className="pi pi-refresh text-orange-400 cursor-pointer hover:text-orange-600 transition-all" title="รีเซ็ตรหัสผ่าน"></i>
                                <i className="pi pi-pencil text-slate-300 cursor-pointer hover:text-blue-500 transition-all" title="แก้ไขข้อมูล"></i>
                            </div>
                        )} headerClassName="bg-[#f8fafc] text-slate-500 font-bold py-4 text-center pr-6" />
                    </DataTable>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-modern-table .p-datatable-tbody > tr > td {
                    border-bottom: 1px solid #f8fafc !important;
                    padding: 1.25rem 1rem !important;
                }
                .custom-modern-table .p-datatable-tbody > tr:hover {
                    background-color: #f0f9ff !important;
                }
                .p-paginator {
                    background: #f8fafc !important;
                    border-top: 1px solid #f1f5f9 !important;
                }
            `}} />
        </div>
    );
}

export default Members;
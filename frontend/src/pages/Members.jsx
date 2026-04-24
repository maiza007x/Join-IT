import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useAuth } from '../context/AuthContext';
function Members() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Add User State
    const [displayAddDialog, setDisplayAddDialog] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    
    // Role Dialog State
    const [displayRoleDialog, setDisplayRoleDialog] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState(null);
    const [newRole, setNewRole] = useState('user');
    
    const roleOptions = [
        { label: 'แอดมินหลัก (admin)', value: 'admin' },
        { label: 'แอดมินรอง (sub_admin)', value: 'sub_admin' },
        { label: 'ผู้ใช้ทั่วไป (user)', value: 'user' }
    ];
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

    // 3. ฟังก์ชันเพิ่มผู้ใช้
    const handleAddUser = async () => {
        if (!newUserName.trim()) {
            alert("กรุณากรอกชื่อผู้ใช้");
            return;
        }
        try {
            await api.post("/users/add", { full_name: newUserName, role: newUserRole });
            alert("เพิ่มผู้ใช้สำเร็จ สุ่ม Username และ Password เรียบร้อยแล้ว");
            setDisplayAddDialog(false);
            setNewUserName('');
            setNewUserRole('user');
            fetchUsers();
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้:", error);
            alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้");
        }
    };

    // 4. ฟังก์ชันเปลี่ยนบทบาท
    const handleUpdateRole = async () => {
        if (!selectedUserForRole) return;
        try {
            await api.put(`/users/${selectedUserForRole.id}/role`, { role: newRole });
            alert("เปลี่ยนบทบาทสำเร็จ");
            setDisplayRoleDialog(false);
            fetchUsers();
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการเปลี่ยนบทบาท:", error);
            alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท");
        }
    };

    // 5. ฟังก์ชันรีเซ็ตรหัสผ่าน
    const handleResetPassword = async (id, username) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตรหัสผ่านของ "${username}" ?\nรหัสผ่านจะถูกตั้งให้เหมือนกับ username`)) {
            try {
                await api.put(`/users/${id}/reset-password`);
                alert(`รีเซ็ตรหัสผ่านสำเร็จ รหัสผ่านใหม่ของคนนี้คือ: ${username}`);
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน:", error);
                alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
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
                        onClick={() => setDisplayAddDialog(true)}
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
                            <Column field="full_name" header="ชื่อและรูปโปรไฟล์" sortable body={(row) => (
                                <div className="flex items-center gap-3">
                                    {row.avatar_url ? (
                                        <img src={`http://localhost:5000${row.avatar_url}`} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                            {row.full_name ? row.full_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                    <span className="font-semibold">{row.full_name || 'ไม่ได้ระบุชื่อ'}</span>
                                </div>
                            )} />
                            <Column field="role" header="บทบาท ↑↓" body={(row) => (
                                <Tag value={row.role === 'sub_admin' ? 'แอดมินรอง' : row.role} className={`px-3 py-1 text-[11px] font-bold border-none ${row.role === 'admin' ? 'bg-purple-600 text-white' : row.role === 'sub_admin' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'}`} />
                            )} />
                            <Column field="updated_at" header="วันที่อัปเดตล่าสุด ↑↓" body={(row) => {
                                if (!row.updated_at) return '-';
                                const d = new Date(row.updated_at);
                                return `${d.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })} ${d.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute:'2-digit' })}`;
                            }} />

                            <Column header="จัดการ" body={(row) => (
                                <div className="flex gap-2">
                                    <Button 
                                        icon="pi pi-key" 
                                        rounded 
                                        className="p-button-warning p-button-sm border-none bg-orange-400" 
                                        onClick={() => handleResetPassword(row.id, row.username)}
                                        tooltip="รีเซ็ตรหัสผ่าน" tooltipOptions={{ position: 'top' }}
                                    />
                                    <Button 
                                        icon="pi pi-cog" 
                                        rounded 
                                        className="p-button-info p-button-sm bg-blue-500 border-none" 
                                        onClick={() => {
                                            setSelectedUserForRole(row);
                                            setNewRole(row.role);
                                            setDisplayRoleDialog(true);
                                        }}
                                        tooltip="ตั้งค่าบทบาท" tooltipOptions={{ position: 'top' }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        rounded
                                        className={`p-button-danger p-button-sm border-none ${isAdmin ? 'bg-red-500' : 'bg-slate-300 cursor-not-allowed'}`}
                                        onClick={() => handleDeleteUser(row.id, row.username)}
                                        tooltip="ลบผู้ใช้" tooltipOptions={{ position: 'top' }}
                                    />
                                </div>
                            )} style={{ width: '12rem' }} />
                        </DataTable>
                    </div>
                </div>

            </div>

            {/* Dialog เพิ่มผู้ใช้ */}
            <Dialog header="เพิ่มผู้ใช้ระบบ" visible={displayAddDialog} style={{ width: '400px' }} onHide={() => setDisplayAddDialog(false)}>
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">ชื่อ - นามสกุล</label>
                        <InputText value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="ระบุชื่อผู้ใช้งาน" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">บทบาท (Role)</label>
                        <Dropdown value={newUserRole} options={roleOptions} onChange={(e) => setNewUserRole(e.value)} placeholder="เลือกบทบาท" className="w-full" />
                    </div>
                    <Button label="ยืนยันการเพิ่มผู้ใช้" onClick={handleAddUser} className="mt-4 bg-blue-600 border-none hover:bg-blue-700" />
                </div>
            </Dialog>

            {/* Dialog เปลี่ยนบทบาท */}
            <Dialog header={`เปลี่ยนบทบาท: ${selectedUserForRole?.username || ''}`} visible={displayRoleDialog} style={{ width: '400px' }} onHide={() => setDisplayRoleDialog(false)}>
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">เลือกบทบาทใหม่</label>
                        <Dropdown value={newRole} options={roleOptions} onChange={(e) => setNewRole(e.value)} placeholder="เลือกบทบาท" className="w-full" />
                    </div>
                    <Button label="บันทึกการตั้งค่า" onClick={handleUpdateRole} className="mt-4 bg-blue-600 border-none hover:bg-blue-700" />
                </div>
            </Dialog>

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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import axios from 'axios'; // ⚠️ อย่าลืมติดตั้งด้วยคำสั่ง npm install axios ใน Terminal นะครับ

function Members() {
    const navigate = useNavigate();
    
    // 1. เปลี่ยนจากข้อมูล Mockup (จำลอง) เป็นการเก็บ State ข้อมูลจริง
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. ดึงข้อมูลจาก Database ทันทีที่เปิดหน้าเว็บ
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // ⚠️ สำคัญ: อย่าลืมแก้ตรง join-it ให้ตรงกับชื่อโฟลเดอร์โปรเจกต์ใน htdocs (XAMPP) ของคุณนะครับ
            const response = await axios.get("http://localhost/join-it/backend/get_users.php");
            setUsers(response.data);
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
            alert("ไม่สามารถดึงข้อมูลสมาชิกได้ กรุณาตรวจสอบการเชื่อมต่อ API");
        } finally {
            setLoading(false);
        }
    };

    // 3. ฟังก์ชันสำหรับให้ Admin ลบสมาชิก
    const handleDeleteUser = async (id, username) => {
        const currentUserRole = localStorage.getItem("userRole"); // เช็กสิทธิ์ที่เก็บไว้ตอนล็อกอิน

        // ล็อกสิทธิ์ขั้นที่ 1 ที่หน้าบ้าน: ถ้าไม่ใช่ admin จะกดลบไม่ได้
        if (currentUserRole !== "admin") {
            alert("คุณไม่มีสิทธิ์ลบผู้ใช้งานระบบ");
            return;
        }

        // แจ้งเตือนยืนยันการลบ
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${username}" ?`)) {
            try {
                // ⚠️ สำคัญ: แก้ตรง join-it ให้ตรงกับชื่อโฟลเดอร์โปรเจกต์ของคุณเช่นกันครับ
                const response = await axios.post("http://localhost/join-it/backend/delete_user.php", {
                    id: id,
                    current_user_role: currentUserRole
                });

                if (response.data.status === "success") {
                    alert("ลบผู้ใช้สำเร็จ!");
                    // อัปเดต UI หน้าเว็บทันทีโดยไม่ต้อง Refresh หน้าจอ
                    setUsers(users.filter((user) => user.id !== id));
                } else {
                    alert(response.data.message);
                }
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการลบ:", error);
                alert("ไม่สามารถเชื่อมต่อกับระบบเพื่อลบข้อมูลได้");
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
                            loading={loading} // แสดงสถานะหมุน ๆ ตอนกำลังดึงข้อมูล
                            className="p-datatable-sm custom-luxury-table" 
                            rowHover
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                            currentPageReportTemplate="1-10 of {totalRecords}"
                        >
                            <Column field="id" header="#" style={{width: '3rem'}} bodyStyle={{fontWeight: 'bold', color: '#cbd5e1'}} />
                            <Column field="username" header="Username ↑↓" sortable />
                            <Column field="full_name" header="ชื่อ ↑↓" sortable /> {/* เปลี่ยนเป็น full_name ตาม database */}
                            <Column field="role" header="บทบาท ↑↓" sortable body={(row) => (
                                <Tag value={row.role} className={`px-3 py-1 text-[11px] font-bold border-none ${row.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'}`} />
                            )} />
                            <Column field="updated_at" header="อัปเดตล่าสุด ↑↓" sortable /> {/* ใส่ updated_at ที่มีอยู่ใน db */}
                            
                            <Column header="จัดการ" body={(row) => (
                                <div className="flex gap-2">
                                    <Button icon="pi pi-cog" rounded className="p-button-info p-button-sm bg-blue-500 border-none" />
                                    <Button 
                                        icon="pi pi-trash" 
                                        rounded 
                                        className="p-button-danger p-button-sm bg-red-500 border-none" 
                                        onClick={() => handleDeleteUser(row.id, row.username)} // เรียกใช้ฟังก์ชันลบ
                                    />
                                </div>
                            )} style={{ width: '8rem' }} />
                        </DataTable>
                    </div>
                </div>

            </div>

            {/* Custom Style */}
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

export default Members;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog } from 'primereact/dialog'; // ✅ นำเข้า Dialog
import { Password } from 'primereact/password'; // ✅ นำเข้า Password input สำหรับไอคอนลูกตา

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState("");

    // --- State สำหรับ Dialog เปลี่ยนรหัสผ่าน ---
    const [displayBasic, setDisplayBasic] = useState(false); // ควบคุมการเปิด/ปิด Dialog
    const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
    const [passError, setPassError] = useState("");

    const fetchProfile = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users/me');
            setUserData(res.data);
            setFullName(res.data.fullName || "");
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchProfile(); }, []);

    // ฟังก์ชันเปลี่ยนรหัสผ่าน
    const handleSavePassword = async () => {
        if (passForm.new !== passForm.confirm) {
            setPassError("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }
        try {
            await axios.put('http://localhost:5000/api/users/me/password', {
                currentPassword: passForm.current,
                newPassword: passForm.new
            });
            alert("เปลี่ยนรหัสผ่านสำเร็จ!");
            setDisplayBasic(false); // ปิด Dialog
            setPassForm({ current: "", new: "", confirm: "" }); // ล้างค่า
            setPassError("");
        } catch (err) {
            setPassError(err.response?.data?.message || "เกิดข้อผิดพลาด");
        }
    };

    if (loading) return null;

    return (
        <div style={{ backgroundColor: '#e1f5fe', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
            <h1 style={{ color: '#607d8b', fontWeight: 'bold', marginBottom: '30px' }}>บัญชีของฉัน</h1>

            <div className="card shadow" style={{ width: '100%', maxWidth: '650px', borderRadius: '15px', padding: '40px', backgroundColor: 'white', border: 'none' }}>
                
                {/* ส่วนหัวข้อมูลส่วนตัว */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h3 className="m-0" style={{ fontWeight: 'bold' }}>ข้อมูลส่วนตัว</h3>
                    <button className="btn" style={{ backgroundColor: '#ff9800', color: 'white', borderRadius: '8px' }} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? "ยกเลิก" : "แก้ไข"}
                    </button>
                </div>

                <div className="row mb-4">
                    <div className="col-sm-3"><strong>ชื่อ - สกุล</strong></div>
                    <div className="col-sm-9">
                        {isEditing ? <input className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} /> : <span>{fullName}</span>}
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-sm-3"><strong>สิทธิ์การใช้งาน</strong></div>
                    <div className="col-sm-9"><span>{userData.role}</span></div>
                </div>

                <h3 className="mb-4" style={{ fontWeight: 'bold' }}>ข้อมูลบัญชี</h3>
                
                <div className="row mb-4">
                    <div className="col-sm-3"><strong>username</strong></div>
                    <div className="col-sm-9"><span>{userData.username}</span></div>
                </div>

                {/* 🔴 ส่วนรหัสผ่านที่กดแล้วเปิด Dialog */}
                <div className="row mb-2">
                    <div className="col-sm-3"><strong>รหัสผ่าน</strong></div>
                    <div className="col-sm-9">
                        <button 
                            className="btn btn-link p-0 text-decoration-none" 
                            style={{ color: '#0d6efd' }}
                            onClick={() => setDisplayBasic(true)} // เปิดหน้าต่าง
                        >
                            เปลี่ยนรหัสผ่าน
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ Dialog (Modal) เปลี่ยนรหัสผ่าน */}
            <Dialog 
                header="เปลี่ยนรหัสผ่าน" 
                visible={displayBasic} 
                style={{ width: '400px' }} 
                onHide={() => setDisplayBasic(false)}
                draggable={false}
                resizable={false}
            >
                <div className="p-fluid">
                    {passError && <div className="text-danger mb-2 small">{passError}</div>}
                    
                    <div className="mb-3">
                        <label className="d-block mb-1">รหัสผ่านเดิม</label>
                        <Password value={passForm.current} onChange={(e) => setPassForm({...passForm, current: e.target.value})} toggleMask feedback={false} />
                    </div>

                    <div className="mb-3">
                        <label className="d-block mb-1">รหัสผ่านใหม่</label>
                        <Password value={passForm.new} onChange={(e) => setPassForm({...passForm, new: e.target.value})} toggleMask feedback={false} />
                    </div>

                    <div className="mb-4">
                        <label className="d-block mb-1">ยืนยันรหัสผ่านใหม่</label>
                        <Password value={passForm.confirm} onChange={(e) => setPassForm({...passForm, confirm: e.target.value})} toggleMask feedback={false} />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={() => setDisplayBasic(false)}>ยกเลิก</button>
                        <button className="btn" style={{ backgroundColor: '#2ecc71', color: 'white' }} onClick={handleSavePassword}>บันทึก</button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Profile;
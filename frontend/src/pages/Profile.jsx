import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    const [fullName, setFullName] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [universityName, setUniversityName] = useState("");
    const [uploading, setUploading] = useState(false);

    const [displayBasic, setDisplayBasic] = useState(false);
    const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
    const [passError, setPassError] = useState("");

   const fetchProfile = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        // ตรวจสอบข้อมูลจาก res.data โดยตรง (ไม่ต้องผ่าน .success หรือ .data)
        const data = res.data;
        
        if (data && data.username) {
            setUserData(data);
            // เปลี่ยนจาก full_name เป็น fullName ตามรูป JSON ของคุณ
            setFullName(data.fullName || ""); 
            setAcademicYear(data.academic_year || "");
            setUniversityName(data.university_name || "");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/users/upload-avatar', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            alert("อัปโหลดรูปโปรไฟล์สำเร็จ!");
            fetchProfile(); 
        } catch (err) {
            alert("อัปโหลดรูปภาพล้มเหลว");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/users/me', {
                fullName: fullName, 
                academic_year: academicYear,
                university_name: universityName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("บันทึกข้อมูลสำเร็จ!");
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            alert("บันทึกล้มเหลว");
        }
    };

    const handleSavePassword = async () => {
        if (passForm.new !== passForm.confirm) {
            setPassError("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/users/me/password', {
                currentPassword: passForm.current,
                newPassword: passForm.new,
                confirmNewPassword: passForm.confirm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("เปลี่ยนรหัสผ่านสำเร็จ!");
            setDisplayBasic(false);
            setPassForm({ current: "", new: "", confirm: "" });
            setPassError("");
        } catch (err) {
            setPassError("เกิดข้อผิดพลาด");
        }
    };

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (!userData) return <div className="text-center mt-5 text-danger">ไม่พบข้อมูลผู้ใช้</div>;

    return (
        <div style={{ backgroundColor: '#e1f5fe', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px', paddingBottom: '50px' }}>
            <h1 style={{ color: '#607d8b', fontWeight: 'bold', marginBottom: '30px' }}>บัญชีของฉัน</h1>

            <div className="card shadow" style={{ width: '100%', maxWidth: '650px', borderRadius: '15px', padding: '40px', backgroundColor: 'white', border: 'none' }}>
                
                <div className="text-center mb-4">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                            src={userData.avatar_url ? `http://localhost:5000${userData.avatar_url}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                            alt="Profile"
                            style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                        />
                        <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#2ecc71', color: 'white', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>
                            <i className={uploading ? "pi pi-spin pi-spinner" : "pi pi-camera"}></i>
                            <input id="avatar-upload" type="file" hidden accept="image/*" onChange={handleFileChange} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h3 className="m-0" style={{ fontWeight: 'bold' }}>ข้อมูลส่วนตัว</h3>
                    <div>
                        {isEditing && (
                            <button className="btn btn-success me-2" onClick={handleUpdateProfile}>บันทึก</button>
                        )}
                        <button className="btn" style={{ backgroundColor: isEditing ? '#6c757d' : '#ff9800', color: 'white' }} onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? "ยกเลิก" : "แก้ไข"}
                        </button>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-sm-4"><strong>ชื่อ - สกุล</strong></div>
                    <div className="col-sm-8">
                        {isEditing ? (
                            <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        ) : (
                            <span>{userData.fullName}</span>
                        )}
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-sm-4"><strong>มหาวิทยาลัย</strong></div>
                    <div className="col-sm-8">
                        {isEditing ? (
                            <input className="form-control" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
                        ) : (
                            <span>{universityName || "-"}</span>
                        )}
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-sm-4"><strong>ปีการศึกษา</strong></div>
                    <div className="col-sm-8">
                        {isEditing ? (
                            <input className="form-control" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                        ) : (
                            <span>{academicYear || "-"}</span>
                        )}
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-sm-4"><strong>สิทธิ์การใช้งาน</strong></div>
                    <div className="col-sm-8">
                        <span className="badge bg-info text-dark">{userData.role}</span>
                    </div>
                </div>

                <h3 className="mb-4" style={{ fontWeight: 'bold' }}>ข้อมูลบัญชี</h3>
                <div className="row mb-3">
                    <div className="col-sm-4"><strong>ชื่อผู้ใช้งาน</strong></div>
                    <div className="col-sm-8"><span>{userData.username}</span></div>
                </div>
                <div className="row mb-2">
                    <div className="col-sm-4"><strong>รหัสผ่าน</strong></div>
                    <div className="col-sm-8">
                        <button className="btn btn-link p-0 text-decoration-none" onClick={() => setDisplayBasic(true)}>เปลี่ยนรหัสผ่าน</button>
                    </div>
                </div>
            </div>

            <Dialog header="เปลี่ยนรหัสผ่าน" visible={displayBasic} style={{ width: '90%', maxWidth: '400px' }} onHide={() => setDisplayBasic(false)} draggable={false} resizable={false}>
                <div className="p-fluid">
                    {passError && <div className="alert alert-danger p-2 small">{passError}</div>}
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
                        <button className="btn btn-secondary" onClick={() => setDisplayBasic(false)}>ยกเลิก</button>
                        <button className="btn btn-success" onClick={handleSavePassword}>บันทึกรหัสผ่าน</button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Profile;
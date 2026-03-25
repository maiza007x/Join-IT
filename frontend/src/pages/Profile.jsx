import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // เพิ่ม navigate สำหรับ logout
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';

const Profile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // ป้องกัน Double Click

    const [fullName, setFullName] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [universityName, setUniversityName] = useState("");
    const [uploading, setUploading] = useState(false);

    const [displayBasic, setDisplayBasic] = useState(false);
    const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
    const [passError, setPassError] = useState("");

    const toast = useRef(null);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            if (data && data.username) {
                setUserData(data);
                setFullName(data.fullName || "");
                setAcademicYear(data.academic_year || "");
                setUniversityName(data.university_name || "");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูลล้มเหลว' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateProfile = async () => {
        // UX: Dirty Check - ถ้าข้อมูลไม่เปลี่ยนเลย ไม่ต้องยิง API
        if (fullName === userData.fullName && 
            academicYear === userData.academic_year && 
            universityName === userData.university_name) {
            setIsEditing(false);
            return;
        }

        // UX: Basic Validation
        if (!fullName.trim()) {
            toast.current.show({ severity: 'warn', summary: 'คำเตือน', detail: 'กรุณากรอกชื่อ-นามสกุล' });
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/users/me', {
                fullName,
                academic_year: academicYear,
                university_name: universityName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกข้อมูลเรียบร้อย', life: 3000 });
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'บันทึกล้มเหลว' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePassword = async () => {
        // UX: Frontend Validation
        if (!passForm.current || !passForm.new || !passForm.confirm) {
            setPassError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
            return;
        }
        if (passForm.new.length < 6) {
            setPassError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }
        if (passForm.new !== passForm.confirm) {
            setPassError("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/users/me/password', {
                currentPassword: passForm.current,
                newPassword: passForm.new,
                confirmNewPassword: passForm.confirm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'เปลี่ยนรหัสผ่านเรียบร้อย ระบบกำลังนำคุณไปเข้าสู่ระบบใหม่...', life: 2000 });
            
            // UX: Logout Flow หลังเปลี่ยนรหัสผ่านสำเร็จ (Best Practice สำหรับความปลอดภัย)
            setTimeout(() => {
                localStorage.removeItem('token');
                navigate('/login');
            }, 2000);

        } catch (err) {
            const msg = err.response?.data?.message || "รหัสผ่านเดิมไม่ถูกต้อง";
            setPassError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // UX: Check File Size (ตัวอย่าง 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.current.show({ severity: 'warn', summary: 'ไฟล์ใหญ่เกินไป', detail: 'ขนาดรูปภาพต้องไม่เกิน 2MB' });
            return;
        }

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
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'อัปโหลดรูปโปรไฟล์เรียบร้อย', life: 3000 });
            fetchProfile(); 
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'อัปโหลดรูปภาพล้มเหลว' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><i className="pi pi-spin pi-spinner" style={{fontSize: '2rem', color: '#3498db'}}></i><p className="mt-2 text-muted">กำลังโหลดความหรูหรา...</p></div>;
    if (!userData) return <div className="text-center mt-5 text-danger">ไม่พบข้อมูลผู้ใช้</div>;

    return (
        <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Kanit', sans-serif" }}>
            <Toast ref={toast} />
            
            <div className="mx-auto" style={{ maxWidth: '850px' }}>
                <h2 className="mb-4" style={{ color: '#1e293b', fontWeight: '800', fontSize: '1.75rem' }}>
                    การตั้งค่าบัญชี
                </h2>

                <div className="card shadow-lg border-0" style={{ borderRadius: '24px', overflow: 'hidden', backgroundColor: '#fff' }}>
                    <div style={{ height: '160px', background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    </div>
                    
                    <div style={{ padding: '0 40px 40px 40px', marginTop: '-75px', position: 'relative' }}>
                        <div className="text-center mb-5">
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div className="p-1" style={{ borderRadius: '50%', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                    <img 
                                        src={userData.avatar_url ? `http://localhost:5000${userData.avatar_url}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                        alt="Profile"
                                        style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff' }} 
                                    />
                                </div>
                                <div style={{ position: 'absolute', bottom: '15px', right: '10px', width: '22px', height: '22px', backgroundColor: '#2ecc71', borderRadius: '50%', border: '4px solid white shadow-sm' }}></div>
                                
                                <label htmlFor="avatar-upload" style={{ position: 'absolute', top: '10px', right: '-5px', backgroundColor: '#1e293b', color: 'white', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid white', transition: 'all 0.3s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} className="upload-btn">
                                    <i className={uploading ? "pi pi-spin pi-spinner" : "pi pi-camera"} style={{ fontSize: '14px' }}></i>
                                    <input id="avatar-upload" type="file" hidden accept="image/*" onChange={handleFileChange} disabled={uploading} />
                                </label>
                            </div>
                            <h3 className="mt-3 mb-1 fw-bold text-dark">{userData.fullName || userData.username}</h3>
                            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '0.85rem' }}>{userData.role?.toUpperCase()}</span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="m-0 fw-bold text-dark">ข้อมูลส่วนตัว</h5>
                                <p className="text-muted small m-0">จัดการข้อมูลพื้นฐานและรายละเอียดของคุณ</p>
                            </div>
                            <div>
                                {isEditing ? (
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-primary px-4 shadow-sm" style={{ borderRadius: '12px', fontWeight: '600' }} onClick={handleUpdateProfile} disabled={isSaving}>
                                            {isSaving ? <i className="pi pi-spin pi-spinner me-2"></i> : null} บันทึกข้อมูล
                                        </button>
                                        <button className="btn btn-light px-4 border" style={{ borderRadius: '12px' }} onClick={() => setIsEditing(false)} disabled={isSaving}>ยกเลิก</button>
                                    </div>
                                ) : (
                                    <button className="btn px-4 shadow-sm text-white" style={{ borderRadius: '12px', fontWeight: '600', backgroundColor: '#f39c12', border: 'none', transition: 'all 0.3s' }} onClick={() => setIsEditing(true)}>
                                        <i className="pi pi-user-edit me-2"></i>แก้ไขโปรไฟล์
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-0 shadow-sm mb-5" style={{ backgroundColor: '#fafbfc', borderRadius: '20px' }}>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block">ชื่อ - สกุล</label>
                                    {isEditing ? (
                                        <input className="form-control custom-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="เช่น สมชาย ใจดี" />
                                    ) : (
                                        <div className="d-flex align-items-center gap-2"><i className="pi pi-info-circle text-primary"></i><p className="fs-6 m-0 fw-semibold">{fullName || "ไม่ได้ระบุ"}</p></div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block">มหาวิทยาลัย</label>
                                    {isEditing ? (
                                        <input className="form-control custom-input" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
                                    ) : (
                                        <div className="d-flex align-items-center gap-2"><i className="pi pi-map-marker text-danger"></i><p className="fs-6 m-0 fw-semibold">{universityName || "ไม่ได้ระบุ"}</p></div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block">ปีการศึกษา</label>
                                    {isEditing ? (
                                        <input className="form-control custom-input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="เช่น 2567" />
                                    ) : (
                                        <div className="d-flex align-items-center gap-2"><i className="pi pi-calendar text-success"></i><p className="fs-6 m-0 fw-semibold">{academicYear || "ไม่ได้ระบุ"}</p></div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block">ชื่อผู้ใช้งาน</label>
                                    <div className="d-flex align-items-center gap-2"><i className="pi pi-at text-info"></i><p className="fs-6 m-0 fw-bold text-primary">@{userData.username}</p></div>
                                </div>
                            </div>
                        </div>

                        <h5 className="mb-3 fw-bold text-dark">ความปลอดภัย</h5>
                        <div className="p-4 border rounded-4 d-flex justify-content-between align-items-center bg-white shadow-sm transition-all" style={{ border: '1px solid #e2e8f0' }}>
                            <div className="d-flex align-items-center">
                                <div className="bg-warning bg-opacity-10 p-3 rounded-4 me-3">
                                    <i className="pi pi-shield text-warning" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <div>
                                    <p className="m-0 fw-bold text-dark">รหัสผ่านบัญชี</p>
                                    <p className="m-0 text-muted small">เปลี่ยนรหัสผ่านสม่ำเสมอเพื่อความปลอดภัย</p>
                                </div>
                            </div>
                            <button className="btn btn-outline-secondary btn-sm px-4 fw-bold" style={{ borderRadius: '10px', padding: '10px 20px', border: '1px solid #d1d5db' }} onClick={() => setDisplayBasic(true)}>
                                เปลี่ยนรหัสผ่าน
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog 
                header={<div className="fw-bold px-2 pt-2">🔒 ตั้งรหัสผ่านใหม่</div>} 
                visible={displayBasic} 
                style={{ width: '95%', maxWidth: '480px' }} 
                onHide={() => { if(!isSaving){ setDisplayBasic(false); setPassError(""); } }}
                draggable={false}
                blockScroll={true}
                className="luxury-dialog"
            >
                <div className="p-fluid pt-2 px-2">
                    {passError && <div className="alert alert-danger border-0 rounded-4 py-2 small mb-4 shadow-sm animate__animated animate__shakeX"><i className="pi pi-exclamation-triangle me-2"></i>{passError}</div>}
                    
                    <div className="field mb-4">
                        <label className="fw-bold small mb-2 text-dark">รหัสผ่านปัจจุบัน</label>
                        <Password 
                            value={passForm.current} 
                            onChange={(e) => setPassForm({...passForm, current: e.target.value})} 
                            toggleMask feedback={false} 
                            placeholder="กรอกรหัสผ่านเดิม" 
                            className="w-100"
                        />
                    </div>

                    <Divider align="center" className="my-4"><span className="text-muted small px-2">ตั้งค่ารหัสใหม่</span></Divider>

                    <div className="field mb-3">
                        <label className="fw-bold small mb-2 text-dark">รหัสผ่านใหม่</label>
                        <Password 
                            value={passForm.new} 
                            onChange={(e) => setPassForm({...passForm, new: e.target.value})} 
                            toggleMask 
                            placeholder="อย่างน้อย 6 ตัวอักษร"
                            promptLabel="ความปลอดภัยของรหัสผ่าน"
                            weakLabel="อ่อนแอ" mediumLabel="พอใช้" strongLabel="แข็งแรง"
                        />
                    </div>

                    <div className="field mb-4">
                        <label className="fw-bold small mb-2 text-dark">ยืนยันรหัสผ่านใหม่</label>
                        <Password 
                            value={passForm.confirm} 
                            onChange={(e) => setPassForm({...passForm, confirm: e.target.value})} 
                            toggleMask feedback={false} 
                            placeholder="ยืนยันอีกครั้ง" 
                        />
                    </div>

                    <button 
                        className="btn btn-primary w-100 py-3 fw-bold shadow-lg" 
                        style={{ borderRadius: '15px', background: 'linear-gradient(90deg, #3a7bd5 0%, #00d2ff 100%)', border: 'none' }} 
                        onClick={handleSavePassword}
                        disabled={isSaving}
                    >
                        {isSaving ? <i className="pi pi-spin pi-spinner me-2"></i> : null} ยืนยันการเปลี่ยนรหัสผ่าน
                    </button>
                    <p className="text-center mt-3 text-muted x-small" style={{fontSize: '0.75rem'}}>คุณจะถูกขอให้เข้าสู่ระบบใหม่อีกครั้งหลังจากเปลี่ยนสำเร็จ</p>
                </div>
            </Dialog>

            <style>{`
                .custom-input {
                    border-radius: 12px !important;
                    padding: 10px 15px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                .custom-input:focus {
                    box-shadow: 0 0 0 3px rgba(58, 123, 213, 0.1) !important;
                    border-color: #3a7bd5 !important;
                }
                .upload-btn:hover {
                    transform: scale(1.1);
                    background-color: #2563eb !important;
                }
                /* PrimeReact Password Component UX Fixes */
                .p-password input {
                    width: 100%;
                    border-radius: 12px !important;
                    padding: 12px 15px !important;
                }
                .p-password-show-icon, .p-password-hide-icon {
                    right: 15px !important;
                }
                .luxury-dialog .p-dialog-header {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 1.5rem !important;
                }
                .luxury-dialog .p-dialog-content {
                    padding: 1.5rem !important;
                }
                .animate__shakeX {
                    animation: shakeX 0.5s;
                }
                @keyframes shakeX {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
};

export default Profile;
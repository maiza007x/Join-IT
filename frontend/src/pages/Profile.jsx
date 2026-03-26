import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';

const Profile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
        if (fullName === userData.fullName &&
            academicYear === userData.academic_year &&
            universityName === userData.university_name) {
            setIsEditing(false);
            return;
        }

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

    if (loading) return <div className="text-center mt-5"><i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#3498db' }}></i><p className="mt-2 text-muted">กำลังโหลดความหรูหรา...</p></div>;
    if (!userData) return <div className="text-center mt-5 text-danger">ไม่พบข้อมูลผู้ใช้</div>;

    return (
        <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Kanit', sans-serif" }}>
            <Toast ref={toast} />

            <div className="mx-auto" style={{ maxWidth: '850px' }}>
                
                {/* Header Section: Title & Back Button */}
                <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="m-0" style={{ color: '#1e293b', fontWeight: '800', fontSize: '1.75rem' }}>
                        การตั้งค่าบัญชี
                    </h2>
                    <button 
                        onClick={() => navigate('/tasks')} 
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-blue-600 border border-gray-200 rounded-xl shadow-sm transition-all duration-200 font-semibold text-sm"
                    >
                        <i className="pi pi-arrow-left" style={{ fontSize: '0.8rem' }}></i>
                        <span>ย้อนกลับไปหน้างาน</span>
                    </button>
                </div>

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

                        <div className="flex justify-between items-center mb-6 px-2">
                            <div>
                                <h5 className="m-0 font-bold text-gray-800 text-lg">ข้อมูลส่วนตัว</h5>
                            </div>
                            <div>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md font-semibold hover:bg-blue-700 transition-all text-sm" onClick={handleUpdateProfile} disabled={isSaving}>
                                            {isSaving ? <i className="pi pi-spin pi-spinner mr-2"></i> : null} บันทึก
                                        </button>
                                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-200 transition-all text-sm" onClick={() => setIsEditing(false)} disabled={isSaving}>ยกเลิก</button>
                                    </div>
                                ) : (
                                    <button className="px-4 py-2 bg-amber-500 text-white rounded-xl shadow-md font-semibold hover:bg-amber-600 transition-all text-sm" onClick={() => setIsEditing(true)}>
                                        <i className="pi pi-user-edit mr-2"></i>แก้ไขโปรไฟล์
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 mb-8 px-2">
                            <div className="flex flex-col space-y-2 text-left">
                                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <i className="pi pi-user text-blue-400"></i> ชื่อ - สกุล
                                </label>
                                {!isEditing ? (
                                    <span className="text-gray-800 font-semibold text-lg">{fullName || "ไม่ได้ระบุ"}</span>
                                ) : (
                                    <input className="w-full p-2.5 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm bg-blue-50/30" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                )}
                            </div>

                            <div className="flex flex-col space-y-2 text-left">
                                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <i className="pi pi-map-marker text-red-400"></i> มหาวิทยาลัย
                                </label>
                                {!isEditing ? (
                                    <span className="text-gray-800 font-semibold text-lg">{universityName || "ไม่ได้ระบุ"}</span>
                                ) : (
                                    <input className="w-full p-2.5 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm bg-blue-50/30" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
                                )}
                            </div>

                            <div className="flex flex-col space-y-2 text-left">
                                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <i className="pi pi-calendar text-green-400"></i> ปีการศึกษา
                                </label>
                                {!isEditing ? (
                                    <span className="text-gray-800 font-semibold text-lg">{academicYear || "ไม่ได้ระบุ"}</span>
                                ) : (
                                    <input className="w-full p-2.5 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm bg-blue-50/30" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                                )}
                            </div>

                            <div className="flex flex-col space-y-2 text-left">
                                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <i className="pi pi-at text-cyan-400"></i> ชื่อผู้ใช้งาน
                                </label>
                                <div className="flex items-center">
                                    <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">@{userData?.username}</span>
                                </div>
                            </div>
                        </div>

                        <h5 className="mb-4 font-bold text-gray-800 px-2 text-lg">ความปลอดภัย</h5>
                        <div className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center bg-gray-50/50 hover:bg-white transition-all shadow-sm mx-2">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-100 p-3 rounded-xl">
                                    <i className="pi pi-shield text-amber-500" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                                <div>
                                    <p className="m-0 font-bold text-gray-800">รหัสผ่านบัญชี</p>
                                    <p className="m-0 text-gray-500 text-sm">เปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
                                </div>
                            </div>
                            <button className="px-5 py-2 text-gray-600 font-bold border border-gray-300 rounded-xl hover:bg-white hover:shadow-md transition-all text-sm" onClick={() => setDisplayBasic(true)}>
                                เปลี่ยนรหัสผ่าน
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                header={<div className="font-bold px-2 pt-2 flex items-center gap-2">🔒 <span>ตั้งรหัสผ่านใหม่</span></div>}
                visible={displayBasic}
                style={{ width: '95%', maxWidth: '480px' }}
                onHide={() => { if (!isSaving) { setDisplayBasic(false); setPassError(""); } }}
                draggable={false}
                blockScroll={true}
                className="luxury-dialog"
            >
                <div className="p-fluid pt-2 px-2">
                    {passError && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm mb-4 animate__animated animate__shakeX"><i className="pi pi-exclamation-triangle mr-2"></i>{passError}</div>}

                    <div className="field mb-4">
                        <label className="font-bold text-sm mb-2 block text-gray-700">รหัสผ่านปัจจุบัน</label>
                        <Password
                            value={passForm.current}
                            onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                            toggleMask feedback={false}
                            placeholder="กรอกรหัสผ่านเดิม"
                            className="w-full"
                        />
                    </div>

                    <Divider align="center" className="my-6 text-gray-400 text-xs">ตั้งค่ารหัสใหม่</Divider>

                    <div className="field mb-3">
                        <label className="font-bold text-sm mb-2 block text-gray-700">รหัสผ่านใหม่</label>
                        <Password
                            value={passForm.new}
                            onChange={(e) => setPassForm({ ...passForm, new: e.target.value })}
                            toggleMask
                            placeholder="อย่างน้อย 6 ตัวอักษร"
                            className="w-full"
                            promptLabel="ความปลอดภัย" weakLabel="อ่อนแอ" mediumLabel="พอใช้" strongLabel="แข็งแรง"
                        />
                    </div>

                    <div className="field mb-6">
                        <label className="font-bold text-sm mb-2 block text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                        <Password
                            value={passForm.confirm}
                            onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                            toggleMask feedback={false}
                            placeholder="ยืนยันอีกครั้ง"
                            className="w-full"
                        />
                    </div>

                    <button
                        className="w-full py-3.5 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                        style={{ borderRadius: '15px', background: 'linear-gradient(90deg, #3a7bd5 0%, #00d2ff 100%)', border: 'none' }}
                        onClick={handleSavePassword}
                        disabled={isSaving}
                    >
                        {isSaving ? <i className="pi pi-spin pi-spinner mr-2"></i> : null} ยืนยันการเปลี่ยนรหัสผ่าน
                    </button>
                    <p className="text-center mt-4 text-gray-400" style={{ fontSize: '0.75rem' }}>คุณจะถูกขอให้เข้าสู่ระบบใหม่อีกครั้งหลังจากเปลี่ยนสำเร็จ</p>
                </div>
            </Dialog>

            <style>{`
                .upload-btn:hover { transform: scale(1.1); background-color: #2563eb !important; }
                .p-password input { width: 100%; border-radius: 12px !important; padding: 12px 15px !important; border: 1px solid #e2e8f0 !important; }
                .luxury-dialog .p-dialog-header { border-bottom: 1px solid #f8fafc !important; padding: 1.5rem !important; }
                .luxury-dialog .p-dialog-content { padding: 1.5rem !important; }
                @keyframes shakeX { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate__shakeX { animation: shakeX 0.5s; }
            `}</style>
        </div>
    );
};

export default Profile;
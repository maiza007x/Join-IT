import React, { useState, useEffect, useRef } from 'react';
import api, { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

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

    const [siteLogo, setSiteLogo] = useState(null);

    // --- Cropper States ---
    const [cropDialogParams, setCropDialogParams] = useState({ visible: false, src: null });
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const toast = useRef(null);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            const data = res.data.data || res.data;
            if (data && data.username) {
                setUserData(data);
                setFullName(data.fullName || "");
                setAcademicYear(data.academic_year || "");
                setUniversityName(data.university_name || "");
            }

            // ถ้าเป็นผู้ดูแลระบบ ให้พยายามดึงโลโก้ปัจจุบันมาแสดง
            if (data && (data.role === 'admin' || data.role === 'sub_admin')) {
                api.get('/settings').then(setRes => {
                    if (setRes.data?.data?.siteLogo) {
                        setSiteLogo(setRes.data.data.siteLogo);
                    }
                }).catch(err => console.error(err));
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
            await api.put('/users/me', {
                fullName,
                academic_year: academicYear,
                university_name: universityName
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
            await api.put('/users/me/password', {
                currentPassword: passForm.current,
                newPassword: passForm.new,
                confirmNewPassword: passForm.confirm
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
            await api.post('/users/upload-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
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

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleUploadLogo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.current.show({ severity: 'warn', summary: 'ไฟล์ใหญ่ไป', detail: 'ไฟล์รูปภาพต้องไม่เกิน 5MB' });
            return;
        }

        const src = URL.createObjectURL(file);
        setCropDialogParams({ visible: true, src });

        // เราเคลียร์ค่า input file ให้เลือกไฟล์เดิมซ้ำได้ในครั้งหน้า
        e.target.value = '';
    };

    const handleConfirmCropLogo = async () => {
        try {
            setUploading(true);
            const croppedImageBlob = await getCroppedImg(cropDialogParams.src, croppedAreaPixels);

            const formData = new FormData();
            formData.append('logo', croppedImageBlob, 'site-logo.png');

            await api.post('/settings/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.current.show({ severity: 'success', summary: 'สำเร็จ', detail: 'อัปโหลดโลโก้เว็บไซต์เรียบร้อย' });

            // อัปเดตรูปโลโก้ใหม่ทันที
            api.get('/settings').then(setRes => {
                if (setRes.data?.data?.siteLogo) setSiteLogo(setRes.data.data.siteLogo);
            });

            setCropDialogParams({ visible: false, src: null });
        } catch (error) {
            console.error("Upload Logo Error:", error);
            toast.current.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถอัปโหลดโลโก้ได้' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#3498db' }}></i><p className="mt-2 text-muted">กำลังโหลดความหรูหรา...</p></div>;
    if (!userData) return <div className="text-center mt-5 text-danger">ไม่พบข้อมูลผู้ใช้</div>;

    return (
        <div className="bg-[#f0f9ff] min-h-screen p-4 md:p-8 font-sans font-kanit">
            <Toast ref={toast} />

            <div className="mx-auto" style={{ maxWidth: '850px' }}>

                {/* Header Section: Title & Back Button */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6 px-1.5 mt-2">
                    <h2 className="m-0 text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                        ตั้งค่าโปรไฟล์ส่วนตัว
                    </h2>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-xl shadow-sm transition-all duration-200 font-bold text-sm w-full md:w-auto overflow-hidden self-start md:self-auto"
                    >
                        <i className="pi pi-arrow-left text-xs"></i>
                        <span>ยกเลิก (ไปที่รายการงาน)</span>
                    </button>
                </div>

                <div className="card shadow-md border-0 bg-white" style={{ borderRadius: '2rem', overflow: 'hidden' }}>
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
                    </div>

                    <div className="px-5 md:px-10 pb-10" style={{ marginTop: '-65px', position: 'relative' }}>
                        <div className="text-center mb-6">
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div className="p-1 rounded-full bg-white shadow-lg shadow-blue-900/10">
                                    <img
                                        src={getImageUrl(userData.avatar_url)}
                                        alt="Profile"
                                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f8fafc' }}
                                    />
                                </div>
                                <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '18px', height: '18px', backgroundColor: '#22c55e', borderRadius: '50%', border: '3px solid white shadow-sm' }}></div>

                                <label htmlFor="avatar-upload" className="upload-btn absolute -top-1 md:top-2 -right-1 md:-right-2 bg-slate-800 text-white rounded-full flex items-center justify-center cursor-pointer border-4 border-white transition-all shadow-md w-9 h-9 md:w-10 md:h-10">
                                    <i className={uploading ? "pi pi-spin pi-spinner" : "pi pi-camera"} style={{ fontSize: '13px' }}></i>
                                    <input id="avatar-upload" type="file" hidden accept="image/*" onChange={handleFileChange} disabled={uploading} />
                                </label>
                            </div>
                            <h3 className="mt-3 mb-1 font-black text-slate-800 text-xl tracking-tight">{userData.fullName || userData.username}</h3>
                            <span className="badge bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider">{userData.role || 'USER'}</span>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                            <div className="border-l-4 border-blue-500 pl-3">
                                <h5 className="m-0 font-bold text-slate-800 tracking-tight">ข้อมูลส่วนบุคคล (Bio)</h5>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mt-0.5 tracking-widest hidden md:block">Personal Information Edit</p>
                            </div>
                            <div className="self-end md:self-auto w-full md:w-auto">
                                {isEditing ? (
                                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        <button className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 font-bold hover:bg-blue-700 transition-all text-xs" onClick={handleUpdateProfile} disabled={isSaving}>
                                            {isSaving ? <i className="pi pi-spin pi-spinner mr-2"></i> : null} บันทึก
                                        </button>
                                        <button className="flex-1 md:flex-none px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl border-slate-200 hover:bg-slate-200 transition-all font-bold text-xs" onClick={() => setIsEditing(false)} disabled={isSaving}>ยกเลิก</button>
                                    </div>
                                ) : (
                                    <button className="w-full md:w-auto px-6 py-2.5 bg-yellow-500 text-white rounded-xl shadow-md shadow-yellow-200 font-bold hover:bg-yellow-600 transition-all text-xs group" onClick={() => setIsEditing(true)}>
                                        <i className="pi pi-user-edit mr-2 group-hover:scale-110 transition-transform"></i>เข้าสู่โหมดแก้ไข
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8 bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
                            <div className="flex flex-col space-y-1 text-left">
                                <label className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <i className="pi pi-user"></i> ชื่อและนามสกุลเต็ม
                                </label>
                                {!isEditing ? (
                                    <span className="text-slate-700 font-bold text-lg bg-white p-3 rounded-xl border border-white h-full">{fullName || <span className="text-slate-400 italic font-normal">ยังไม่ได้ระบุชื่อจริง</span>}</span>
                                ) : (
                                    <input className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm bg-white font-bold text-slate-700 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="เช่น สมหมาย ใจดี" />
                                )}
                            </div>

                            <div className="flex flex-col space-y-1 text-left">
                                <label className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <i className="pi pi-building"></i> สถานศึกษา / มหาวิทยาลัย
                                </label>
                                {!isEditing ? (
                                    <span className="text-slate-700 font-bold text-lg bg-white p-3 rounded-xl border border-white h-full">{universityName || <span className="text-slate-400 italic font-normal">ยังไม่ได้ระบุสถานศึกษา</span>}</span>
                                ) : (
                                    <input className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm bg-white font-bold text-slate-700 text-sm" value={universityName} onChange={(e) => setUniversityName(e.target.value)} placeholder="ระบุมหาวิทยาลัยของคุณ" />
                                )}
                            </div>

                            <div className="flex flex-col space-y-1 text-left">
                                <label className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <i className="pi pi-calendar"></i> ระดับชั้นปีการศึกษา
                                </label>
                                {!isEditing ? (
                                    <span className="text-slate-700 font-bold text-lg bg-white p-3 rounded-xl border border-white h-full">{academicYear || <span className="text-slate-400 italic font-normal">ไม่ได้ระบุ</span>}</span>
                                ) : (
                                    <input className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm bg-white font-bold text-slate-700 text-sm" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="เช่น ปี 4, ชั้นประกาศนียบัตรวิชาชีพ ฯลฯ" />
                                )}
                            </div>

                            <div className="flex flex-col space-y-1 text-left">
                                <label className="text-indigo-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <i className="pi pi-at"></i> ชื่อผู้ใช้ในระบบ (USERNAME)
                                </label>
                                <div className="flex items-center h-full">
                                    <span className="text-slate-500 font-bold bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 flex-1 flex items-center gap-2 cursor-not-allowed text-sm">
                                        <i className="pi pi-lock text-[10px] text-slate-400"></i> {userData?.username}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="border-l-4 border-amber-500 pl-3 mb-4 mt-6">
                            <h5 className="m-0 font-bold text-slate-800 tracking-tight">การรักษาความปลอดภัยระบบ</h5>
                        </div>
                        <div className="p-4 border border-blue-100 rounded-2xl flex flex-col md:flex-row justify-between md:items-center bg-blue-50/30 hover:bg-blue-50/80 transition-all shadow-sm mx-1 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-100 p-3 rounded-2xl shadow-sm border border-amber-200">
                                    <i className="pi pi-key text-amber-600 text-xl"></i>
                                </div>
                                <div className="text-left">
                                    <p className="m-0 font-black text-slate-800 text-sm">รหัสผ่านบัญชีผู้ใช้</p>
                                    <p className="m-0 text-slate-500 text-xs mt-0.5">ป้องกันบัญชีของคุณด้วยการอัปเดตรหัสผ่าน</p>
                                </div>
                            </div>
                            <button className="w-full md:w-auto px-5 py-2.5 bg-white text-slate-600 font-bold border border-slate-200 rounded-xl hover:text-amber-600 hover:border-amber-300 shadow-sm transition-all text-xs" onClick={() => setDisplayBasic(true)}>
                                จัดการแก้ไขรหัสผ่าน
                            </button>
                        </div>

                        {/* ⚙️ การตั้งค่าระบบ (เฉพาะแอดมิน) */}
                        {(userData.role === 'admin' || userData.role === 'sub_admin') && (
                            <div className="mt-8">
                                <div className="border-l-4 border-indigo-500 pl-3 mb-4">
                                    <h5 className="m-0 font-bold text-slate-800 tracking-tight">การตั้งค่าระบบส่วนกลาง (Admin Only)</h5>
                                </div>
                                <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[2rem] shadow-sm overflow-hidden p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-500/20 mx-1">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-inner p-1 overflow-hidden">
                                            {siteLogo ? (
                                                <img src={getImageUrl(siteLogo)} alt="Site Logo" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <i className="pi pi-images text-2xl text-blue-300"></i>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="m-0 font-bold text-white text-base md:text-lg tracking-tight">โลโก้เว็บไซต์ (Login Page)</h3>
                                            <p className="text-indigo-200 text-xs font-medium mt-1 leading-relaxed">อัปโหลดโลโก้เพื่อแสดงผลระดับสากล<br className="hidden md:block" /> โลโก้ใหม่จะแทนที่ดีไซน์เก่าอัตโนมัติ</p>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto text-right">
                                        <input
                                            type="file"
                                            id="profile-upload-site-logo"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleUploadLogo}
                                        />
                                        <button
                                            className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-xl text-xs md:text-sm font-bold px-6 py-3.5 shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                                            onClick={() => document.getElementById('profile-upload-site-logo').click()}
                                        >
                                            <i className="pi pi-upload"></i> อัปโหลดโลโก้ใหม่
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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

            {/* Dialog สำหรับ Crop รูปภาพ */}
            <Dialog
                header={<div className="font-bold px-2 flex items-center gap-2">✂️ <span>จัดตำแหน่งรูปภาพ</span></div>}
                visible={cropDialogParams.visible}
                style={{ width: '95%', maxWidth: '480px' }}
                onHide={() => setCropDialogParams({ visible: false, src: null })}
                blockScroll={true}
                className="luxury-dialog"
            >
                <div className="p-fluid">
                    <div className="relative w-full h-[300px] bg-slate-900 rounded-2xl overflow-hidden mb-4 rounded-b-none">
                        {cropDialogParams.src && (
                            <Cropper
                                image={cropDialogParams.src}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        <label className="text-xs font-bold text-slate-500 mb-2 block text-center">เลื่อนซูมรูปภาพ</label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full mb-4 accent-indigo-500 h-1 bg-slate-200 rounded-lg appearance-none"
                        />
                        <div className="flex gap-2">
                            <button
                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                                onClick={() => setCropDialogParams({ visible: false, src: null })}
                                disabled={uploading}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-md"
                                onClick={handleConfirmCropLogo}
                                disabled={uploading}
                            >
                                {uploading ? <i className="pi pi-spin pi-spinner mr-2"></i> : null}
                                บันทึกรูปภาพ
                            </button>
                        </div>
                    </div>
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
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";

const CreateTask = () => {
    const navigate = useNavigate();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [departs, setDeparts] = useState([]);
    const [devices, setDevices] = useState([]);

    const [formData, setFormData] = useState({
        date_report: new Date(),
        time_report: new Date(),
        reporter: "",
        department: null,
        tel: "",
        deviceName: null,
        number_device: "",
        ip_address: "",
        work_type: "อุบัติการณ์",
        priority: "ปกติ",
        report: "",
        routine: "ไม่มี"
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await api.get("/tasks/form-options");
                if (response.data.success) {
                    setDeparts(response.data.departs);
                    setDevices(response.data.devices);
                }
            } catch (err) {
                console.error("Error fetching options:", err);
                toast.current?.show({ severity: "error", summary: "Error", detail: "โหลดข้อมูลตัวเลือกไม่สำเร็จ" });
            }
        };
        fetchOptions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Format dates for MySQL
            const payload = {
                ...formData,
                date_report: formData.date_report.toLocaleDateString("en-CA"),
                time_report: formData.time_report.toLocaleTimeString("en-GB", { hour12: false }),
                department: formData.department,
                deviceName: formData.deviceName // This is usually the label or name
            };

            const response = await api.post("/tasks/create-intern-task", payload);
            if (response.data.success) {
                toast.current.show({ severity: "success", summary: "สำเร็จ", detail: "สร้างรายการงานเรียบร้อยแล้ว", life: 3000 });
                setTimeout(() => navigate("/tasks"), 1500);
            }
        } catch (err) {
            console.error("Submit Error:", err);
            toast.current.show({ severity: "error", summary: "ผิดพลาด", detail: "ไม่สามารถบันทึกข้อมูลได้" });
        } finally {
            setLoading(false);
        }
    };

    const priorities = [
        { label: 'ปกติ', value: 'ปกติ' },
        { label: 'ด่วน', value: 'ด่วน' },
        { label: 'ด่วนที่สุด', value: 'ด่วนที่สุด' }
    ];

    const routines = [
        { label: 'ไม่มี', value: 'ไม่มี' },
        { label: 'ทุกวัน', value: 'ทุกวัน' },
        { label: 'ทุกสัปดาห์', value: 'ทุกสัปดาห์' },
        { label: 'ทุกเดือน', value: 'ทุกเดือน' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center font-sans text-slate-700">
            <Toast ref={toast} />
            
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">สร้างงาน</h1>
                    <div className="w-20 h-1.5 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* วันที่และเวลา */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">วันที่แจ้ง</label>
                            <Calendar 
                                value={formData.date_report} 
                                onChange={(e) => setFormData({...formData, date_report: e.value})} 
                                dateFormat="dd/mm/yy" 
                                showIcon 
                                className="w-full custom-input"
                                placeholder="เลือกวันที่"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">เวลาที่แจ้ง</label>
                            <Calendar 
                                value={formData.time_report} 
                                onChange={(e) => setFormData({...formData, time_report: e.value})} 
                                timeOnly 
                                hourFormat="12"
                                showIcon 
                                icon="pi pi-clock"
                                className="w-full custom-input"
                                placeholder="เลือกเวลา"
                            />
                        </div>

                        {/* ผู้แจ้ง หน่วยงาน เบอร์โทร */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ผู้แจ้ง</label>
                            <span className="p-input-icon-left">
                                <i className="pi pi-user text-slate-400" />
                                <InputText 
                                    value={formData.reporter} 
                                    onChange={(e) => setFormData({...formData, reporter: e.target.value})} 
                                    className="w-full custom-input"
                                    placeholder="ชื่อผู้แจ้ง"
                                    required
                                />
                            </span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">หน่วยงาน</label>
                            <Dropdown 
                                value={formData.department} 
                                options={departs} 
                                onChange={(e) => setFormData({...formData, department: e.value})} 
                                placeholder="กรุณาเลือก..." 
                                filter
                                className="w-full custom-dropdown"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">เบอร์โทร</label>
                            <span className="p-input-icon-left">
                                <i className="pi pi-phone text-slate-400" />
                                <InputText 
                                    value={formData.tel} 
                                    onChange={(e) => setFormData({...formData, tel: e.target.value})} 
                                    className="w-full custom-input"
                                    placeholder="เบอร์โทรติดต่อ"
                                />
                            </span>
                        </div>

                        {/* อุปกรณ์ ครุภัณฑ์ IP */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">อุปกรณ์</label>
                            <Dropdown 
                                value={formData.deviceName} 
                                options={devices} 
                                onChange={(e) => setFormData({...formData, deviceName: e.value})} 
                                placeholder="กรุณาเลือก..." 
                                filter
                                className="w-full custom-dropdown"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">หมายเลขครุภัณฑ์ (ถ้ามี)</label>
                            <InputText 
                                value={formData.number_device} 
                                onChange={(e) => setFormData({...formData, number_device: e.target.value})} 
                                className="w-full custom-input"
                                placeholder="-"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">หมายเลข IP address</label>
                            <InputText 
                                value={formData.ip_address} 
                                onChange={(e) => setFormData({...formData, ip_address: e.target.value})} 
                                className="w-full custom-input"
                                placeholder="-"
                            />
                        </div>

                        {/* ประเภทงาน และ ความเร่งด่วน */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ประเภทงาน (ไม่บังคับ)</label>
                            <div className="flex gap-4 mt-2">
                                <div className="flex align-items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex-1">
                                    <RadioButton inputId="type1" name="work_type" value="อุบัติการณ์" onChange={(e) => setFormData({...formData, work_type: e.value})} checked={formData.work_type === 'อุบัติการณ์'} />
                                    <label htmlFor="type1" className="ml-2 font-bold text-sm text-slate-600">อุบัติการณ์</label>
                                </div>
                                <div className="flex align-items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex-1">
                                    <RadioButton inputId="type2" name="work_type" value="งานอื่นๆ" onChange={(e) => setFormData({...formData, work_type: e.value})} checked={formData.work_type === 'งานอื่นๆ'} />
                                    <label htmlFor="type2" className="ml-2 font-bold text-sm text-slate-600">งานอื่นๆ</label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ระดับความเร่งด่วน (ไม่บังคับ)</label>
                            <Dropdown 
                                value={formData.priority} 
                                options={priorities} 
                                onChange={(e) => setFormData({...formData, priority: e.value})} 
                                placeholder="เลือก..." 
                                className="w-full custom-dropdown"
                            />
                        </div>
                    </div>

                    {/* อาการที่ได้รับแจ้ง */}
                    <div className="flex flex-col gap-3 mt-8">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">อาการที่ได้รับแจ้ง</label>
                        <InputTextarea 
                            value={formData.report} 
                            onChange={(e) => setFormData({...formData, report: e.target.value})} 
                            rows={4} 
                            className="w-full custom-input" 
                            placeholder="..."
                            required
                        />
                    </div>

                    {/* Routine */}
                    <div className="flex flex-col gap-3 mt-8 max-w-xs">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">กำหนด Routine</span>
                            <i className="pi pi-caret-down text-xs"></i>
                        </div>
                        <Dropdown 
                            value={formData.routine} 
                            options={routines} 
                            onChange={(e) => setFormData({...formData, routine: e.value})} 
                            className="w-full custom-dropdown mt-1"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="mt-12">
                        <Button 
                            label="บันทึก" 
                            type="submit" 
                            loading={loading}
                            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 border-none font-black text-lg shadow-xl shadow-blue-200 transition-all"
                        />
                    </div>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-input {
                    border-radius: 0.85rem !important;
                    border: 1px solid #e2e8f0 !important;
                    padding: 0.75rem 1rem !important;
                    font-weight: 600;
                    color: #334155;
                    transition: all 0.2s;
                }
                .p-input-icon-left .custom-input {
                    padding-left: 2.5rem !important;
                }
                .custom-input:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                }
                .custom-dropdown {
                    border-radius: 0.85rem !important;
                    border: 1px solid #e2e8f0 !important;
                    background: #fff !important;
                    transition: all 0.2s;
                    height: 48px;
                    display: flex;
                    align-items: center;
                }
                .custom-dropdown:not(.p-disabled).p-focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                }
                .custom-dropdown .p-dropdown-label {
                    font-weight: 600;
                    color: #334155;
                    padding: 0.75rem 1rem;
                }
                .p-calendar .p-inputtext {
                    border-radius: 0.85rem !important;
                }
                .p-radiobutton .p-radiobutton-box {
                    border-radius: 50%;
                    border: 2px solid #cbd5e1;
                }
                .p-radiobutton .p-radiobutton-box.p-highlight {
                    border-color: #3b82f6;
                    background: #3b82f6;
                }
            ` }} />
        </div>
    );
};

export default CreateTask;

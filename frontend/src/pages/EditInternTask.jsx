import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";

const EditInternTask = ({ visible, onHide, taskData, onSuccess }) => {
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
        report: "",
    });

    useEffect(() => {
        if (visible) {
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

            if (taskData) {
                // Parse date
                let dateReport = new Date();
                if (taskData.date_report) {
                    dateReport = new Date(taskData.date_report);
                }
                
                // Parse time
                let timeReport = new Date();
                if (taskData.time_report) {
                    const [hours, minutes] = taskData.time_report.split(':');
                    timeReport.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                }

                setFormData({
                    date_report: dateReport,
                    time_report: timeReport,
                    reporter: taskData.reporter || "",
                    department: taskData.department || null,
                    tel: taskData.tel || "",
                    deviceName: taskData.deviceName || null,
                    number_device: taskData.number_device || "",
                    ip_address: taskData.ip_address || "",
                    report: taskData.report || "",
                });
            }
        }
    }, [visible, taskData]);

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
                deviceName: formData.deviceName
            };

            const response = await api.put(`/tasks/edit-intern-task/${taskData.id}`, payload);
            if (response.data.success) {
                toast.current?.show({ severity: "success", summary: "สำเร็จ", detail: "แก้ไขงานเรียบร้อยแล้ว", life: 3000 });
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            }
        } catch (err) {
            console.error("Submit Error:", err);
            toast.current?.show({ severity: "error", summary: "ผิดพลาด", detail: err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            header="แก้ไขงาน" 
            visible={visible} 
            onHide={onHide}
            style={{ width: '90vw', maxWidth: '800px' }}
            className="custom-dialog-radius"
            contentClassName="pb-2"
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* วันที่และเวลา */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">วันที่แจ้ง</label>
                        <Calendar
                            value={formData.date_report}
                            onChange={(e) => setFormData({ ...formData, date_report: e.value })}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className="w-full custom-input"
                            placeholder="เลือกวันที่"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">เวลาที่แจ้ง</label>
                        <Calendar
                            value={formData.time_report}
                            onChange={(e) => setFormData({ ...formData, time_report: e.value })}
                            timeOnly
                            hourFormat="12"
                            showIcon
                            icon="pi pi-clock"
                            className="w-full custom-input"
                            placeholder="เลือกเวลา"
                        />
                    </div>

                    {/* ผู้แจ้ง หน่วยงาน เบอร์โทร */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ผู้แจ้ง</label>
                        <span className="p-input-icon-left w-full">
                            <i className="pi pi-user text-slate-400" />
                            <InputText
                                value={formData.reporter}
                                onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                                className="w-full custom-input"
                                placeholder="ชื่อผู้แจ้ง"
                                required
                            />
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">หน่วยงาน</label>
                        <Dropdown
                            value={formData.department}
                            options={departs}
                            onChange={(e) => setFormData({ ...formData, department: e.value })}
                            placeholder="กรุณาเลือก..."
                            filter
                            className="w-full custom-dropdown"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">เบอร์โทร</label>
                        <span className="p-input-icon-left w-full">
                            <i className="pi pi-phone text-slate-400" />
                            <InputText
                                value={formData.tel}
                                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                                className="w-full custom-input"
                                placeholder="เบอร์โทรติดต่อ"
                            />
                        </span>
                    </div>

                    {/* อุปกรณ์ ครุภัณฑ์ IP */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">อุปกรณ์</label>
                        <Dropdown
                            value={formData.deviceName}
                            options={devices}
                            onChange={(e) => setFormData({ ...formData, deviceName: e.value })}
                            placeholder="กรุณาเลือก..."
                            filter
                            className="w-full custom-dropdown"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">หมายเลขครุภัณฑ์ (ถ้ามี)</label>
                        <InputText
                            value={formData.number_device}
                            onChange={(e) => setFormData({ ...formData, number_device: e.target.value })}
                            className="w-full custom-input"
                            placeholder="-"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">หมายเลข IP address</label>
                        <InputText
                            value={formData.ip_address}
                            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                            className="w-full custom-input"
                            placeholder="-"
                        />
                    </div>
                </div>

                {/* อาการที่ได้รับแจ้ง */}
                <div className="flex flex-col gap-2 mt-6">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">อาการที่ได้รับแจ้ง</label>
                    <InputTextarea
                        value={formData.report}
                        onChange={(e) => setFormData({ ...formData, report: e.target.value })}
                        rows={4}
                        className="w-full custom-input"
                        placeholder="..."
                        required
                    />
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end gap-3">
                    <Button
                        label="ยกเลิก"
                        type="button"
                        className="p-button-text p-button-secondary font-bold"
                        onClick={onHide}
                    />
                    <Button
                        label="บันทึกการแก้ไข"
                        type="submit"
                        loading={loading}
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 border-none font-bold text-white shadow-lg shadow-blue-200 transition-all"
                    />
                </div>
            </form>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-dialog-radius .p-dialog-header {
                    border-top-left-radius: 1.5rem !important;
                    border-top-right-radius: 1.5rem !important;
                }
                .custom-dialog-radius .p-dialog-content {
                    border-bottom-left-radius: 1.5rem !important;
                    border-bottom-right-radius: 1.5rem !important;
                }
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
            ` }} />
        </Dialog>
    );
};

export default EditInternTask;

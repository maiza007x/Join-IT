import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import api, { getImageUrl } from "../services/api";

// รายละเอียดผู้รับงานนักศึกษา (สิ่งที่ช่วย / สิ่งที่ได้เรียนรู้) ใช้ key={task.id} เพื่อโหลดใหม่ทุกครั้งที่เปิดงานอื่น
const InternAssigneesDialog = ({ task, onHide }) => {
    const [assignees, setAssignees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/tasks/intern-task-assignees/${task.id}`)
            .then((res) => setAssignees(res.data.assignees))
            .catch((err) => console.error("❌ Fetch Assignees Details Error:", err))
            .finally(() => setLoading(false));
    }, [task.id]);

    const statusBadge = (status) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-white ${status === "closed" ? "bg-green-600" : "bg-amber-500"}`}>
            <i className={`pi ${status === "closed" ? "pi-check-circle" : "pi-clock"} text-[9px]`}></i>
            {status === "closed" ? "เสร็จสิ้น" : "กำลังทำ"}
        </span>
    );

    return (
        <Dialog
            header={
                <div className="flex items-center gap-3 text-orange-950">
                    <i className="pi pi-users text-xl bg-orange-100 p-2 rounded-xl text-orange-600"></i>
                    <div>
                        <span className="text-base font-black block leading-tight">ความคืบหน้าทีมผู้ร่วมงาน</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-widest font-bold">
                            {task.deviceName || "รายละเอียดงาน"}
                        </span>
                    </div>
                </div>
            }
            visible
            onHide={onHide}
            style={{ width: "90vw", maxWidth: "600px" }}
            modal
            dismissableMask
            closeOnEscape
        >
            <div className="flex flex-col gap-4 py-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <i className="pi pi-spin pi-spinner text-3xl text-orange-500"></i>
                        <span className="text-slate-400 text-xs font-bold">กำลังโหลดรายละเอียด...</span>
                    </div>
                ) : assignees.length > 0 ? (
                    assignees.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black text-sm overflow-hidden border border-orange-200/30">
                                        {item.avatar_url ? (
                                            <img src={getImageUrl(item.avatar_url)} alt={item.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            item.full_name?.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h5 className="m-0 font-bold text-slate-800 text-sm">{item.full_name}</h5>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">ผู้ร่วมภารกิจ</span>
                                    </div>
                                </div>
                                {statusBadge(item.status)}
                            </div>

                            <div className="flex flex-col gap-3 text-xs leading-relaxed">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <i className="pi pi-pencil text-[10px] text-blue-500"></i> รายละเอียดการช่วยเหลือ
                                    </span>
                                    <p className="m-0 text-slate-700 font-medium">
                                        {item.contribution_detail || <span className="text-slate-300">ยังไม่มีการบันทึกรายละเอียด</span>}
                                    </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <i className="pi pi-heart text-[10px] text-red-500"></i> สิ่งที่ได้เรียนรู้
                                    </span>
                                    <p className="m-0 text-slate-600">
                                        {item.learning_outcome || <span className="text-slate-300">ยังไม่มีการบันทึกการเรียนรู้</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold">
                        ไม่พบรายละเอียดผู้ร่วมงาน
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default InternAssigneesDialog;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [joinedTasks, setJoinedTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  // ✅ ฟังก์ชันออกจากระบบ - ปรับ Path ให้เด้งไปหน้าแรกตาม App.jsx
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true }); 
  };

  const confirmLogout = () => {
    confirmDialog({
      message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      header: 'ยืนยันการออกจากระบบ',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger rounded-xl px-4',
      rejectClassName: 'p-button-text rounded-xl px-4',
      acceptLabel: 'ใช่, ออกจากระบบ',
      rejectLabel: 'ยกเลิก',
      accept: handleLogout,
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((task) => task.date === today);

  const statusTemplate = () => (
    <Tag severity="warning" value="รอดำเนินการ" rounded className="px-3" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }} />
  );

  const handleJoin = (id) => {
    setJoinedTasks((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  const actionTemplate = (rowData) => {
    const isJoined = joinedTasks.includes(rowData.id);
    return (
      <Button
        label={isJoined ? "เข้าร่วมแล้ว" : "มีส่วนร่วม"}
        icon={isJoined ? "pi pi-check" : "pi pi-sign-in"}
        rounded
        severity={isJoined ? "success" : "info"}
        className={`px-4 py-2 text-xs font-bold transition-all ${isJoined ? 'bg-green-500 border-none' : 'bg-[#1e293b] border-none shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
        onClick={() => handleJoin(rowData.id)}
      />
    );
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans">
      <ConfirmDialog />
      
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <i className="pi pi-list text-white text-xl"></i> {/* เปลี่ยนไอคอนเป็น list */}
            </div>
            <div>
              {/* ✅ เปลี่ยนหัวข้อกลับตามความต้องการ */}
              <h1 className="text-xl md:text-2xl font-black text-[#1e293b] tracking-tight">
                ระบบจัดการงานเจ้าหน้าที่
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Official Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              icon="pi pi-user"
              className="p-button-rounded p-button-text text-slate-600 font-bold"
              onClick={() => navigate("/profile")}
              label="โปรไฟล์"
            />
            
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <button 
              onClick={confirmLogout}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm transition-all hover:bg-red-50 hover:border-red-100 hover:text-red-600 active:scale-95"
            >
              <i className="pi pi-sign-out text-xs transition-transform group-hover:translate-x-1"></i>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* งานวันนี้ */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                <div>
                  <h3 className="m-0 font-bold text-white text-lg tracking-tight">งานค้างวันนี้</h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Daily Operations</p>
                </div>
              </div>
              <div className="bg-white/10 px-4 py-1.5 rounded-full text-white font-black text-sm border border-white/10">
                {todayTasks.length} งาน
              </div>
            </div>

            <div className="p-4">
              <DataTable 
                value={todayTasks} 
                emptyMessage="ไม่มีงานค้างสำหรับวันนี้" 
                responsiveLayout="stack" 
                className="p-datatable-sm custom-table"
                rowHover
              >
                <Column field="id" header="#" headerStyle={{width: '3rem'}} bodyStyle={{fontWeight: 'bold', color: '#94a3b8'}} />
                <Column field="date" header="วันที่" sortable />
                <Column field="title" header="เอกสาร / ชื่องาน" className="font-bold text-slate-700" />
                <Column field="creator_name" header="ผู้สร้าง" />
                <Column header="สถานะ" body={statusTemplate} />
                <Column header="การทำงาน" body={actionTemplate} />
              </DataTable>
            </div>
          </div>

          {/* ประวัติงานทั้งหมด */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <h3 className="m-0 font-bold text-slate-800 tracking-tight">ประวัติงานทั้งหมด</h3>
               <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">History Overview</span>
            </div>

            <div className="p-4">
              <DataTable 
                value={tasks} 
                paginator 
                rows={10} 
                className="p-datatable-sm" 
                responsiveLayout="scroll"
                rowHover
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="{first}-{last} of {totalRecords}"
              >
                <Column field="id" header="หมายเลข" />
                <Column field="date" header="วันที่" sortable />
                <Column field="title" header="เอกสาร" className="font-medium" />
                <Column field="creator_name" header="ผู้จัดการ" />
                <Column header="สถานะ" body={statusTemplate} />
                <Column header="ดำเนินการ" body={actionTemplate} />
              </DataTable>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-table .p-datatable-thead > tr > th {
          background-color: transparent !important;
          color: #94a3b8 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          border: none !important;
          padding: 1.5rem 1rem !important;
        }
        .p-datatable-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 1.25rem 1rem !important;
          font-size: 0.9rem !important;
        }
        .p-paginator {
          border: none !important;
          padding: 1.5rem !important;
          font-size: 0.8rem !important;
        }
        .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
          background: #f1f5f9 !important;
          color: #1e293b !important;
          border-radius: 12px !important;
        }
      `}} />
    </div>
  );
}

export default Tasks;
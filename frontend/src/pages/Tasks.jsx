import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ เพิ่ม
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Outlet } from "react-router-dom";

<Outlet />

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [joinedTasks, setJoinedTasks] = useState([]);
  const navigate = useNavigate(); // ✅ เพิ่ม

  useEffect(() => {
    fetch("http://localhost:5000/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  // งานวันนี้
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((task) => task.date === today);

  const statusTemplate = () => (
    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
      รอดำเนินการ
    </span>
  );

  const handleJoin = (id) => {
    setJoinedTasks((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  const actionTemplate = (rowData) => {
    const isJoined = joinedTasks.includes(rowData.id);

    return (
      <Button
        label={isJoined ? "เข้าร่วมแล้ว" : "มีส่วนร่วม"}
        icon={isJoined ? "pi pi-check" : "pi pi-sign-in"}
        className={`border-none rounded-2xl px-4 py-2 text-sm font-semibold ${
          isJoined
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        onClick={() => handleJoin(rowData.id)}
      />
    );
  };

  return (
    <div className="bg-[#f4f7fc] min-h-screen p-5 font-sans">
      <div className="max-w-[1100px] mx-auto">

      
        <div className="mb-5 border-b pb-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1e3a8a]">
            ระบบจัดการงานเจ้าหน้าที่
          </h1>

         
          <Button
            icon="pi pi-user"
            className="p-button-rounded p-button-text"
            onClick={() => navigate("/profile")}
            label="Profile"
          />
        </div>

        {/* ===== งานวันนี้ ===== */}
        <Card className="mb-5">
          <div className="p-4 border-b bg-blue-50">
            <h3 className="m-0 font-semibold text-blue-700">งานวันนี้</h3>
            <p className="text-sm text-gray-500 m-0">
              มีทั้งหมด {todayTasks.length} งาน
            </p>
          </div>

          <DataTable value={todayTasks} emptyMessage="ไม่มีงานวันนี้">
            <Column field="id" header="หมายเลข" />
            <Column field="date" header="วันที่" />
            <Column field="title" header="เอกสาร" />
            <Column field="creator_name" header="สร้างโดย" />
            <Column header="สถานะ" body={statusTemplate} />
            <Column header="การทำงาน" body={actionTemplate} />
          </DataTable>
        </Card>

        {/* ===== งานทั้งหมด ===== */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="m-0 font-semibold">งานทั้งหมด</h3>
          </div>

          <DataTable value={tasks} paginator rows={5}>
            <Column field="id" header="หมายเลข" />
            <Column field="date" header="วันที่" />
            <Column field="title" header="เอกสาร" />
            <Column field="creator_name" header="สร้างโดย" />
            <Column header="สถานะ" body={statusTemplate} />
            <Column header="การทำงาน" body={actionTemplate} />
          </DataTable>
        </Card>

      </div>
    </div>
  );
}

export default Tasks;
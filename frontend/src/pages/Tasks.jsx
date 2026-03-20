// import { useEffect, useState } from "react";
// import { Button } from "primereact/button";
// import { DataTable } from "primereact/datatable";
// import { Column } from "primereact/column";
// function Tasks() {
//   const [tasks, setTasks] = useState([]);

//   useEffect(() => {
//     fetch("http://localhost:5000/api/tasks")
//       .then(res => res.json())
//       .then(data => setTasks(data));
//   }, []);

//   const loadTasks = async () => {
//     const res = await API.get("/tasks");
//     setTasks(res.data);
//   };

//   const statusTemplate = () => {
//     return <span className="status-badge">รอดำเนินการ</span>;
//   };

//   const actionTemplate = (rowData) => {
//     return (
//       <Button
//         label="มีส่วนร่วม"
//         className="join-btn"
//         onClick={() => alert("join " + rowData.id)}
//       />
//     );
//   };

//   return (
//     <div className="task-container">

//       {/* Header */}
//       <h2 className="title">ระบบจัดการงานของเจ้าหน้าที่</h2>

//       <div className="user-box">
//         <div>
//           <small>นักศึกษาฝึกงานปัจจุบัน:</small>
//           <div><b>สมชาย ใจดี (S001)</b></div>
//         </div>

//         <Button label="สลับนักศึกษา" className="switch-btn" />
//       </div>

//       {/* Card */}
//       <div className="task-card">
//         <div className="card-header">
//           <h3>งานทั้งหมด</h3>
//           <p>แสดง 1 ถึง {tasks.length} จากทั้งหมด {tasks.length} รายการ</p>
//         </div>

//         <DataTable value={tasks} paginator rows={5}>

//           <Column field="id" header="หมายเลข" />
//           <Column field="date" header="วันที่" />
//           <Column field="title" header="เอกสาร" />
//           <Column field="creator_name" header="สร้างโดย" />

//           <Column
//             header="ผู้เข้าร่วม"
//             body={() => <span className="no-user">ยังไม่มีผู้เข้าร่วม</span>}
//           />

//           <Column header="สถานะ" body={statusTemplate} />
//           <Column header="การทำงาน" body={actionTemplate} />

//         </DataTable>
//       </div>

//     </div>
//   );
// }



// export default Tasks;

import { useEffect, useState } from "react";
// อิมพอร์ต PrimeReact Components
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card"; // นำเข้า Card เพิ่มเพื่อความสวยงาม

function Tasks() {
  const [tasks, setTasks] = useState([]);

  // ** ไม่มีการแก้ไขส่วน Logic นี้ **
  useEffect(() => {
    fetch("http://localhost:5000/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  // ** ไม่มีการแก้ไขส่วน Logic นี้ **
  const loadTasks = async () => {
    // Note: 'API' is not imported in original snippet, assuming it exists globally or is defined elsewhere in your project.
    // Uncommenting this line might cause an error if 'API' is not defined.
    // const res = await API.get("/tasks"); 
    // setTasks(res.data);
  };

  // ตกแต่ง Template สำหรับคอลัมน์ "สถานะ"
  const statusTemplate = () => {
    return (
      <span style={styles.statusBadge}>
        รอดำเนินการ
      </span>
    );
  };

  // ตกแต่ง Template สำหรับคอลัมน์ "การทำงาน"
  const actionTemplate = (rowData) => {
    return (
      <Button
        label="มีส่วนร่วม"
        icon="pi pi-sign-in" // เพิ่มไอคอน
        style={styles.joinBtn} // ตกแต่งปุ่ม
        onClick={() => alert("join " + rowData.id)}
      />
    );
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        
        {/* Header - ตกแต่งส่วนหัว */}
        <div style={styles.pageHeader}>
          <h2 style={styles.title}>ระบบจัดการงานของเจ้าหน้าที่</h2>
          <i className="pi pi-cog" style={styles.titleIcon}></i>
        </div>

        {/* Card สำหรับ DataTable - ตกแต่งกรอบตาราง */}
        <Card style={styles.taskCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>งานทั้งหมด</h3>
            <p style={styles.cardSubTitle}>
              แสดง 1 ถึง {tasks.length} จากทั้งหมด {tasks.length} รายการ
            </p>
          </div>

          <DataTable 
            value={tasks} 
            paginator 
            rows={5} 
            stripedRows // เพิ่มลายแถว
            responsiveLayout="scroll"
            tableStyle={styles.table} // ตกแต่งตาราง
            size="small" // ปรับขนาด
          >
            <Column field="id" header="หมายเลข" style={styles.colId} />
            <Column field="date" header="วันที่" sortable style={styles.colDate} />
            <Column field="title" header="เอกสาร" style={styles.colTitle} />
            <Column field="creator_name" header="สร้างโดย" style={styles.colCreator} />

            <Column
              header="ผู้เข้าร่วม"
              body={() => (
                <span style={styles.noUser}>
                  ยังไม่มีผู้เข้าร่วม
                </span>
              )}
            />

            <Column header="สถานะ" body={statusTemplate} />
            <Column header="การทำงาน" body={actionTemplate} />

          </DataTable>
        </Card>
      </div>
    </div>
  );
}

// ไฟล์สไตล์ CSS-in-JS สำหรับตกแต่ง
const styles = {
  pageContainer: {
    backgroundColor: "#f4f7fc", // พื้นหลังหน้าเว็บ
    minHeight: "100vh",
    padding: "20px"
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "2px solid #e0e6ed",
    paddingBottom: "10px"
  },
  title: {
    margin: 0,
    color: "#1e3a8a", // สีน้ำเงินเข้ม
    fontWeight: "700"
  },
  titleIcon: {
    fontSize: "1.5rem",
    color: "#64748b"
  },
  userBox: {
    backgroundColor: "#fff",
    padding: "15px 20px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  userLabel: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginBottom: "3px",
    display: "block"
  },
  userName: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: "#333",
    fontSize: "1.1rem"
  },
  userIcon: {
    color: "#16a34a", // สีเขียว
    fontSize: "1rem"
  },
  switchBtn: {
    backgroundColor: "#fff",
    color: "#2563eb", // สีฟ้าหลัก
    borderColor: "#2563eb",
    borderRadius: "20px",
    padding: "8px 15px",
    fontSize: "0.9rem",
    fontWeight: "600"
  },
  taskCard: {
    borderRadius: "10px",
    border: "none",
    padding: "0px",
    overflow: "hidden"
  },
  cardHeader: {
    padding: "15px 20px",
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #e5e7eb"
  },
  cardTitle: {
    margin: "0 0 5px 0",
    color: "#333",
    fontSize: "1.2rem",
    fontWeight: "600"
  },
  cardSubTitle: {
    margin: 0,
    color: "#888",
    fontSize: "0.9rem"
  },
  table: {
    minWidth: "60rem"
  },
  // ปรับความกว้างคอลัมน์
  colId: { width: '10%' },
  colDate: { width: '15%' },
  colTitle: { width: '25%' },
  colCreator: { width: '15%' },

  // ตกแต่งส่วนเสริมต่างๆ
  noUser: {
    color: "#6b7280", // สีเทา
    fontSize: "0.9rem",
    fontStyle: "italic"
  },
  statusBadge: {
    backgroundColor: "#fee2e2", // สีแดงอ่อน
    color: "#dc2626", // สีแดง
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600"
  },
  joinBtn: {
    backgroundColor: "#2563eb", // สีฟ้าหลัก
    border: "none",
    borderRadius: "15px", // มนๆ
    padding: "8px 15px",
    fontSize: "0.9rem",
    fontWeight: "600"
  }
};

export default Tasks;
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/tasks")
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  return (
    <div className="container">
      <h1 className="title">ระบบจัดการงานของเจ้าหน้าที่</h1>

      <div className="card">
        <div className="header">งานทั้งหมด</div>

        <table>
          <thead>
            <tr>
              <th>หมายเลข</th>
              <th>วันที่</th>
              <th>งาน</th>
              <th>หน่วยงาน</th>
              <th>ปี</th>
              <th>ผู้สร้าง</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.date}</td>
                <td>{task.title}</td>
                <td>{task.department}</td>
                <td>{task.year}</td>
                <td>{task.creator}</td>
                <td>
                  <span className="status">{task.status}</span>
                </td>
                <td>
                  <button className="btn">มีส่วนร่วม</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
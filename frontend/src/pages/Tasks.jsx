import { useEffect, useState } from "react";

function Tasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/tasks")
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  return (
    <div>
      <h2>งานทั้งหมด</h2>

      <button>+ สร้างงาน</button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>งาน</th>
            <th>สถานะ</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {tasks.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.title}</td>
              <td>{t.status}</td>
              <td>
                <button>มีส่วนร่วม</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Tasks;
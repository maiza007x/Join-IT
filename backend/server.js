const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// mock data
let tasks = [
  {
    id: 10505,
    date: "17/03/2026 16:30",
    title: "เช็คเครื่องคอม และอุปกรณ์",
    department: "IT",
    year: 2056,
    creator: "Admin",
    status: "รอดำเนินการ"
  },
  {
    id: 10506,
    date: "17/03/2026 08:30",
    title: "สำรองข้อมูล Offline",
    department: "IT",
    year: "-",
    creator: "Admin",
    status: "รอดำเนินการ"
  }
];

// API
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.listen(5000, () => {
  console.log('Server running http://localhost:5000');
});
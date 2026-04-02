import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Members from "./pages/Members"; 
import MyTasks from "./pages/MyTasks";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css"; // ✅ อย่าลืม import icons นะครับ
import MyTasks from "./pages/MyTasks"; // หรือ path ที่คุณเก็บไฟล์ไว้
const ProtectedAdminRoute = ({ children }) => {
  const userRole = localStorage.getItem("userRole"); // ดึง role ที่เก็บไว้ตอนล็อกอิน

  if (userRole !== "admin") {
    alert("ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น");
    return <Navigate to="/tasks" />; // ถ้าไม่ใช่แอดมิน ให้ดีดไปหน้าอื่นแทน เช่น /tasks
  }
  return children;
};
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้าทั่วไป */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        
        {/* หน้าสำหรับพนักงาน/ผู้ใช้ทั่วไป */}
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* ✅ คุมเส้นทางสำหรับหน้าจัดการสมาชิก (ล็อกให้เข้าได้เฉพาะแอดมิน) */}
        


<Route path="/members" element={<Members />} />




        {/* ถ้าพิมพ์ URL มั่วๆ หรือพยายามเข้าหน้าอื่นโดยไม่ได้สิทธิ์ ให้ดีดกลับไปหน้า Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
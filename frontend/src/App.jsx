import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Profile from "./pages/profile";
import ForgotPassword from "./pages/ForgotPassword";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css"; // ✅ อย่าลืม import icons นะครับ

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ แก้ไข: ให้ทั้ง "/" และ "/login" วิ่งไปที่หน้า Login เหมือนกัน */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ แนะนำ: ใช้ตัวเล็กทั้งหมดเพื่อป้องกันการพิมพ์ผิด (จาก /Tasks เป็น /tasks) */}
        <Route path="/tasks" element={<Tasks />} />
        
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ✅ ถ้าพิมพ์ URL มั่วๆ ให้ดีดกลับไปหน้า Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
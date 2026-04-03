import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Members from "./pages/Members"; 
import MyTasks from "./pages/MyTasks";
import Navbar from "./components/Navbar"; 
import { AuthProvider } from './context/AuthContext';
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css"; // ✅ อย่าลืม import icons นะครับ
const ProtectedAdminRoute = ({ children }) => {
  const userRole = localStorage.getItem("userRole"); // ดึง role ที่เก็บไว้ตอนล็อกอิน

  if (userRole !== "admin") {
    alert("ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น");
    return <Navigate to="/tasks" />; // ถ้าไม่ใช่แอดมิน ให้ดีดไปหน้าอื่นแทน เช่น /tasks
  }
  return children;
};

// --- 2. Main Wrapper (ตัวคุม Navbar) ---
const LayoutWrapper = () => {
  const location = useLocation();
  
  // เช็คว่าหน้าปัจจุบันคือหน้า Login หรือหน้าทั่วไปที่ไม่อยากให้เห็นเมนูหรือไม่
  const noNavbarPaths = ["/", "/login", "/register", "/forgot-password"];
  const shouldShowNavbar = !noNavbarPaths.includes(location.pathname);

  return (
    <>
      {/* Navbar จะแสดงผลเสมอถ้าไม่ใช่หน้า Login */}
      {shouldShowNavbar && <Navbar />}

      {/* กำหนดระยะห่าง (Padding) เฉพาะหน้าที่โชว์ Navbar */}
      <div className={shouldShowNavbar ? "p-4" : ""}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route 
            path="/members" 
            element={
              <ProtectedAdminRoute>
                <Members />
              </ProtectedAdminRoute>
            } 
          />

          {/* Fallback - ถ้าไม่เจอหน้าไหนเลยให้กลับไปหน้าแรก */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

// --- 3. Root App ---
function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper />
    </BrowserRouter>
  );
}

export default App;
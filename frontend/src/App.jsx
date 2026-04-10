import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Members from "./pages/Members";
import MyTasks from "./pages/MyTasks";
import Dashboard from "./pages/Dashboard";
import CreateTask from "./pages/CreateTask";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmDialog } from 'primereact/confirmdialog';
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Toast } from 'primereact/toast';
import { useRef, useEffect } from "react";
import socket from "./services/socket";
import { useNavigate } from "react-router-dom";

// --- 1. Guard: ต้องล็อกอินก่อนถึงจะเข้าได้ ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // AuthContext จัดการ loading screen อยู่แล้ว

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// --- 2. Guard: เฉพาะ Admin เท่านั้น (ใช้ role จาก /me API ผ่าน AuthContext) ---
const ProtectedAdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    alert("ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น");
    return <Navigate to="/tasks" replace />;
  }

  return children;
};

// --- 3. Main Wrapper (ตัวคุม Navbar) ---
const LayoutWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const globalToast = useRef(null);

  const noNavbarPaths = ["/", "/login", "/register", "/forgot-password"];
  const shouldShowNavbar = !noNavbarPaths.includes(location.pathname);

  // --- Real-time Notification Listener ---
  useEffect(() => {
    socket.on("new-task", (data) => {
      globalToast.current?.show({
        severity: 'info',
        summary: '📥 มีงานใหม่ในระบบ!',
        detail: (
          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-800">{data.deviceName}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{data.report}</div>
            <button
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-700 shadow-sm self-start"
              onClick={() => navigate('/tasks')}
            >
              ดูรายการงาน
            </button>
          </div>
        ),
        life: 10000 // แสดงนิ่งๆ 10 วินาที
      });

      // ถ้าต้องการให้มีเสียงแจ้งเตือน สามารถเพิ่มตรงนี้ได้
      // const audio = new Audio('/notification.mp3');
      // audio.play();
    });

    return () => {
      socket.off("new-task");
    };
  }, [navigate]);

  return (
    <>
      <Toast ref={globalToast} position="top-right" />
      {shouldShowNavbar && <Navbar />}

      <div className={shouldShowNavbar ? "p-4" : ""}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />

          {/* User Routes (ต้องล็อกอินก่อน) */}
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route
            path="/members"
            element={
              <ProtectedAdminRoute>
                <Members />
              </ProtectedAdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

// --- 4. Root App ---
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* ConfirmDialog วางไว้ที่ root เดียว ครอบทุกหน้า ไม่ต้องวางซ้ำในแต่ละ component */}
        <ConfirmDialog />
        <LayoutWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
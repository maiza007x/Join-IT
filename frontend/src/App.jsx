import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Members from "./pages/Members";
import MyTasks from "./pages/MyTasks";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from './context/AuthContext';
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

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

  const noNavbarPaths = ["/", "/login", "/register", "/forgot-password"];
  const shouldShowNavbar = !noNavbarPaths.includes(location.pathname);

  return (
    <>
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
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

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
        <LayoutWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
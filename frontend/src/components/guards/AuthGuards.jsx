import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// --- 1. Guard: ต้องล็อกอินก่อนถึงจะเข้าได้ ---
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // AuthContext จัดการ loading screen อยู่แล้ว

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🛡️ ถ้าล็อกอินแล้วแต่ยังไม่ได้ยืนยันตัวตน (verified = 0) 
  // ให้ส่งไปที่หน้า Profile เพื่อตั้งค่าเบื้องต้นเท่านั้น (ยกเว้นกำลังอยู่ที่หน้า Profile อยู่แล้ว)
  if (user.verified === 0 && window.location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

// --- 2. Guard: เฉพาะ Admin เท่านั้น ---
export const ProtectedAdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.verified === 0 && window.location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  if (!isAdmin) {
    alert("ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น");
    return <Navigate to="/tasks" replace />;
  }

  return children;
};

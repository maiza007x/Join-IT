import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

// เข้าจาก Order-IT โดยไม่ต้อง login ซ้ำ: Order-IT เปิดหน้า /sso#ticket=<ตั๋ว> (ดู docs/PLAN-staff-login.md Phase 7)
// ตั๋วอยู่หลัง # จึงไม่ถูกส่งไปเซิร์ฟเวอร์และไม่ติด log
const readTicket = () => new URLSearchParams(window.location.hash.slice(1)).get("ticket");

function SsoLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [ticket] = useState(readTicket);
  const [error, setError] = useState(() => (ticket ? "" : "ไม่พบข้อมูลเข้าสู่ระบบ กรุณากดปุ่มจาก Order-IT ใหม่"));
  const started = useRef(false); // ตั๋วใช้ได้ครั้งเดียว กัน effect ทำงานซ้ำ (StrictMode)

  useEffect(() => {
    // ลบตั๋วออกจากแถบที่อยู่/ประวัติของเบราว์เซอร์
    window.history.replaceState(null, "", window.location.pathname);
    if (!ticket || started.current) return;
    started.current = true;

    API.post("/auth/sso", { ticket })
      .then((res) => {
        login(res.data.data, res.data.token);
        navigate("/tasks", { replace: true });
      })
      .catch((err) => setError(err.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ"));
  }, [ticket, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <i className="pi pi-exclamation-circle text-4xl text-rose-500 mb-4"></i>
            <p className="text-slate-700 font-semibold mb-6">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full h-11 rounded-xl border-none bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-700"
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </>
        ) : (
          <>
            <i className="pi pi-spin pi-spinner text-4xl text-blue-600 mb-4"></i>
            <p className="text-slate-500 font-semibold m-0">กำลังเข้าสู่ระบบจาก Order-IT...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default SsoLogin;

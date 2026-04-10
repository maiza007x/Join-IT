import { useState, useRef, useEffect } from "react";
import API, { getImageUrl } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);
  const { login } = useAuth();

  const [siteLogo, setSiteLogo] = useState(null);

  useEffect(() => {
    API.get('/settings')
      .then(res => {
        if (res.data?.data?.siteLogo) {
          setSiteLogo(res.data.data.siteLogo);
        }
      })
      .catch(err => console.error("Could not load site logo:", err));
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.current.show({ severity: 'warn', summary: 'ข้อมูลไม่ครบ', detail: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน', life: 3000 });
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      // เรียก login() จาก AuthContext เพื่ออัพเดต user state ทันที
      login(res.data.data, res.data.token);
      navigate("/tasks");
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Login Failed', detail: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex justify-center items-center overflow-hidden bg-[#f8fafc]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]"></div>

      <Toast ref={toast} />

      <div className="z-10 w-full max-w-[420px] px-6">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">

          <div className="text-center mb-10">
            {siteLogo ? (
              <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white bg-white/50 backdrop-blur-sm overflow-hidden">
                <img src={getImageUrl(siteLogo)} alt="Site Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-200 mb-6 transform -rotate-6">
                <i className="pi pi-bolt text-white text-3xl"></i>
              </div>
            )}
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">JOIN-IT</h1>
            <p className="text-slate-500 text-sm font-medium">เข้าสู่ระบบเพื่อจัดการงานของคุณ</p>
          </div>

          <div className="space-y-6">
            {/* Username Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Username</label>
              <div className="relative flex items-center group">
                <i className="pi pi-user absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-20"></i>
                <InputText
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  style={{ paddingLeft: '2.75rem' }}
                  className="w-full py-3.5 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative flex items-center group custom-password">
                {/* แม่กุญแจอยู่ด้านซ้าย */}
                <i className="pi pi-lock absolute left-4 top-1/2 -translate-y-2 slate-100 group-focus-within:text-blue-200 transition-colors z-20"></i>
                <Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  placeholder="กรอกรหัสผ่าน"
                  // ดันตัวหนังสือหลบทั้งแม่กุญแจ (ซ้าย) และลูกตา (ขวา)
                  inputStyle={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', width: '100%' }}
                  inputClassName="py-3.5 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  className="w-full"
                />
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <Button
              label={loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              onClick={handleLogin}
              loading={loading}
              className="w-full py-4 bg-slate-900 border-none rounded-2xl text-white font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all"
            />
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-400 text-xs font-medium">
              ยังไม่มีบัญชี?
              <button
                onClick={() => navigate("/contact-admin")}
                className="ml-1 text-blue-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                ติดต่อผู้ดูแล
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-semibold">
          Powered by Chinawat • 2026
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* 1. บังคับให้โครงสร้าง Password กว้างเต็มพื้นที่เสมอ */
        .custom-password, 
        .custom-password .p-password, 
        .custom-password .p-inputwrapper,
        .custom-password input {
          width: 100% !important;
          display: block;
        }

        .custom-password {
          position: relative;
        }
        
        /* 2. บังคับตำแหน่งไอคอนลูกตา (Toggle Mask) ให้อยู่ทางขวาสุดภายใน input */
        .custom-password .p-password-show-icon, 
        .custom-password .p-password-hide-icon {
          position: absolute !important;
          top: auto !important;
          right: 1rem !important; /* ระยะห่างจากขอบขวา */
          left: auto !important;     /* ป้องกันการทับซ้อนกับไอคอนด้านซ้าย */
          transform: translate auto !important;
          z-index: auto !important;
          color: #94a3b8 !important;
          cursor: pointer;
        }

        .p-inputtext:enabled:focus {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
          border-color: #3b82f6 !important;
        }
      `}} />
    </div>
  );
}

export default Login;
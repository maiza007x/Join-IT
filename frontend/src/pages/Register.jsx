import { useState, useRef, useEffect } from "react"; // เพิ่ม useEffect เข้ามา
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);
  const timeoutRef = useRef(null); // ตัวแปรสำหรับเก็บ timer

  // ล้างค่า timeout ทิ้งหากผู้ใช้กดเปลี่ยนหน้าก่อน 2 วินาที
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRegister = async () => {
    // 1. Validation ตรวจสอบข้อมูลเบื้องต้น
    if (!username || !password || !confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'ข้อมูลไม่ครบ', detail: 'กรุณากรอกข้อมูลให้ครบทุกช่อง', life: 3000 });
      return;
    }

    // [เสริม] เช็คความยาวของรหัสผ่านเพื่อความปลอดภัย
    if (password.length < 6) {
      toast.current.show({ severity: 'warn', summary: 'รหัสผ่านสั้นเกินไป', detail: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', life: 3000 });
      return;
    }

    if (password !== confirmPassword) {
      toast.current.show({ severity: 'error', summary: 'รหัสผ่านไม่ตรงกัน', detail: 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง', life: 3000 });
      return;
    }

    setLoading(true);
    try {
      // 2. ยิง API ไปที่หลังบ้าน (Backend)
      await API.post("/auth/register", { username, password });
      
      toast.current.show({ severity: 'success', summary: 'สำเร็จ!', detail: 'สมัครสมาชิกเรียบร้อยแล้ว', life: 2000 });
      
      // เก็บค่า timeout ไว้ใน ref
      timeoutRef.current = setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      toast.current.show({ severity: 'error', summary: 'Register Failed', detail: errorMessage, life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex justify-center items-center overflow-hidden bg-[#f8fafc]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]"></div>

      <Toast ref={toast} />

      <div className="z-10 w-full max-w-105 px-6">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-4xl p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-500 shadow-xl shadow-indigo-200 mb-6 transform rotate-6">
              <i className="pi pi-user-plus text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Create Account</h1>
            <p className="text-slate-500 text-sm font-medium">สมัครสมาชิกเพื่อเข้าใช้งานระบบ</p>
          </div>

          <div className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Username</label>
              <div className="relative flex items-center group">
                <i className="pi pi-user absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-20"></i>
                <InputText
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ตั้งชื่อผู้ใช้งาน"
                  style={{ paddingLeft: '2.75rem' }} 
                  className="w-full py-3.5 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative flex items-center group custom-password">
                <i className="pi pi-lock absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-20"></i>
                <Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  placeholder="ตั้งรหัสผ่าน"
                  inputStyle={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', width: '100%' }}
                  inputClassName="py-3.5 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  className="w-full"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <div className="relative flex items-center group custom-password">
                <i className="pi pi-check-circle absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-20"></i>
                <Password
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  inputStyle={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', width: '100%' }}
                  inputClassName="py-3.5 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  className="w-full"
                />
              </div>
            </div>

            <Button
              label={loading ? "กำลังบันทึก..." : "สมัครสมาชิก"}
              onClick={handleRegister}
              loading={loading}
              className="w-full py-4 bg-indigo-600 border-none rounded-2xl text-white font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
            />
          </div>

          <div className="mt-10 text-center">
             <p className="text-slate-400 text-xs font-medium">
                มีบัญชีอยู่แล้ว? 
                <button 
                  onClick={() => navigate("/login")}
                  className="ml-1 text-indigo-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
             </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-password, .custom-password .p-password, .custom-password .p-inputwrapper, .custom-password input {
          width: 100% !important; display: block;
        }
        .custom-password { position: relative; }
        .custom-password .p-password-show-icon, .custom-password .p-password-hide-icon {
          position: absolute !important; top: 50% !important; right: 1.25rem !important; left: auto !important; transform: translateY(-50%) !important; z-index: 30 !important; color: #94a3b8 !important; cursor: pointer;
        }
        .p-inputtext:enabled:focus {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
          border-color: #6366f1 !important;
        }
      `}} />
    </div>
  );
}

export default Register;
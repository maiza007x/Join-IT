import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false); // เช็คว่าส่งสำเร็จหรือยัง
  const navigate = useNavigate();
  const toast = useRef(null);

  const handleResetRequest = async () => {
    if (!email) {
      toast.current.show({ severity: 'warn', summary: 'กรุณากรอกข้อมูล', detail: 'ระบุอีเมลที่ใช้ลงทะเบียน', life: 3000 });
      return;
    }

    setLoading(true);
    try {
      // จำลองการเรียก API (ในอนาคตเปลี่ยนเป็น API.post("/auth/forgot-password", { email }))
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      setIsSent(true);
      toast.current.show({ severity: 'success', summary: 'ส่งรหัสผ่านแล้ว', detail: 'กรุณาตรวจสอบที่อีเมลของคุณ', life: 5000 });
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: 'ไม่พบอีเมลนี้ในระบบ', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex justify-center items-center overflow-hidden bg-[#f8fafc]">
      {/* 🔮 Background Orbs */}
      <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-50/60 blur-[100px]"></div>
      <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-indigo-50/60 blur-[100px]"></div>

      <Toast ref={toast} />

      <div className="z-10 w-full max-w-[420px] px-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[32px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]">
          
          {/* ส่วนหัว */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 shadow-inner mb-6">
              <i className={`pi ${isSent ? 'pi-check-circle text-green-500' : 'pi-key text-slate-400'} text-2xl`}></i>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              {isSent ? "ตรวจสอบอีเมลของคุณ" : "ลืมรหัสผ่าน?"}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              {isSent 
                ? `เราได้ส่งลิงก์ตั้งค่ารหัสผ่านใหม่ไปที่ ${email} แล้ว` 
                : "ระบุอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่"}
            </p>
          </div>

          {!isSent ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="relative group">
                  <i className="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                  <InputText
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              <Button
                label={loading ? "กำลังส่งข้อมูล..." : "ส่งลิงก์กู้คืนรหัสผ่าน"}
                onClick={handleResetRequest}
                loading={loading}
                className="w-full py-4 bg-slate-900 border-none rounded-2xl text-white font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              />
            </div>
          ) : (
            <Button
              label="กลับหน้าเข้าสู่ระบบ"
              onClick={() => navigate("/login")}
              className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
            />
          )}

          <div className="mt-8 text-center">
             <button 
                onClick={() => navigate("/login")}
                className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-2 mx-auto"
             >
                <i className="pi pi-arrow-left"></i> ย้อนกลับไปหน้า Login
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
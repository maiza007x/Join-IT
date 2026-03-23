import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

// PrimeReact
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) return;

    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/tasks");
    } catch (err) {
      const msg = err.response?.data?.message || "เกิดข้อผิดพลาด ❌";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-b from-[#f0f7ff] to-[#e0efff] font-sans">
      <Card className="w-[380px] rounded-[20px] border-none p-2 shadow-[0_15px_35px_rgba(37,99,235,0.1)]">
        
        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-[60px] h-[60px] bg-[#eff6ff] rounded-full flex justify-center items-center mx-auto mb-4">
            <i className="pi pi-user text-[#2563eb] text-2xl"></i>
          </div>
          <h2 className="m-0 text-[#1e3a8a] text-2xl font-bold">ยินดีต้อนรับ</h2>
          <p className="m-0 mt-1 text-[#64748b] text-sm">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <Divider />

        {/* Form Input */}
        <div className="p-fluid">
          
          {/* Username Field */}
          <div className="mb-4">
            <label htmlFor="username" className="font-semibold mb-2 block text-[#475569] text-sm">
              ชื่อผู้ใช้งาน
            </label>
            <span className="p-input-icon-left w-full">
              <i className="pi pi-user text-[#93c5fd] z-10" />
              <InputText
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="rounded-xl border-[#d1d5db] w-full"
              />
            </span>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="font-semibold mb-2 block text-[#475569] text-sm">
              รหัสผ่าน
            </label>
            <span className="p-input-icon-left w-full">
              <i className="pi pi-lock text-[#93c5fd] z-10" />
              <InputText
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="rounded-xl border-[#d1d5db] w-full"
              />
            </span>
          </div>

          <Button
            label="เข้าสู่ระบบ"
            icon="pi pi-sign-in"
            loading={loading}
            onClick={handleLogin}
            className="w-full bg-[#2563eb] border-none rounded-xl py-3 font-semibold shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:bg-[#1d4ed8] transition-all"
          />
        </div>

        <div className="text-center mt-6 text-[#94a3b8] text-xs">
          <small>© 2026 Your App Name</small>
        </div>
      </Card>
    </div>
  );
}

export default Login;
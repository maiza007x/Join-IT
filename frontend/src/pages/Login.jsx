import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

// PrimeReact
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Password } from "primereact/password"; // นำเข้า Password component

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // เพิ่ม State สำหรับ Password
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
    const msg =
      err.response?.data?.message || "เกิดข้อผิดพลาด ❌";

    alert(msg); // ✅ แสดง message จาก backend
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <i className="pi pi-user" style={{ fontSize: '1.5rem', color: '#2563eb' }}></i>
          </div>
          <h2 style={styles.title}>ยินดีต้อนรับ</h2>
          <p style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <Divider />

        {/* Form Input */}
        <div className="p-fluid">
          
          {/* Username Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username" style={styles.label}>ชื่อผู้ใช้งาน</label>
            <span className="p-input-icon-left">
              <i className="pi pi-user" style={{ color: '#93c5fd', zIndex: 1 }} />
              <InputText
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={styles.input}
              />
            </span>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={styles.label}>รหัสผ่าน</label>
            <span className="p-input-icon-left">
              <i className="pi pi-lock" style={{ color: '#93c5fd', zIndex: 1 }} />
              <InputText
                id="password"
                type="password" // กำหนดเป็น password เพื่อซ่อนตัวอักษร
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={styles.input}
              />
            </span>
          </div>

          <Button
            label="เข้าสู่ระบบ"
            icon="pi pi-sign-in"
            loading={loading}
            onClick={handleLogin}
            style={styles.button}
          />
        </div>

        <div style={styles.footer}>
          <small>© 2026 Your App Name</small>
        </div>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, #f0f7ff 0%, #e0efff 100%)"
  },
  card: {
    width: "380px",
    borderRadius: "20px",
    border: "none",
    padding: "10px",
    boxShadow: "0 15px 35px rgba(37, 99, 235, 0.1)"
  },
  header: {
    textAlign: "center",
    marginBottom: "15px"
  },
  iconCircle: {
    width: "60px",
    height: "60px",
    backgroundColor: "#eff6ff",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 15px auto"
  },
  title: { 
    margin: "0", 
    color: "#1e3a8a", 
    fontSize: "1.5rem",
    fontWeight: "700" 
  },
  subtitle: { 
    margin: "5px 0 0 0", 
    color: "#64748b",
    fontSize: "0.9rem"
  },
  label: {
    fontWeight: "600",
    marginBottom: "8px",
    display: "block",
    color: "#475569",
    fontSize: "0.9rem"
  },
  input: {
    borderRadius: "10px",
    border: "1px solid #d1d5db",
  },
  button: {
    marginTop: "10px",
    width: "100%",
    borderRadius: "10px",
    padding: "12px",
    backgroundColor: "#2563eb",
    border: "none",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
  },
  footer: {
    textAlign: "center",
    marginTop: "25px",
    color: "#94a3b8"
  }
};

export default Login;
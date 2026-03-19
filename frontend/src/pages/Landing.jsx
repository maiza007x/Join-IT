import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Join IT</h1>
      <p>ระบบสำหรับนักศึกษาฝึกงาน</p>

      <button onClick={() => navigate('/login')}>
        เข้าสู่ระบบ
      </button>
    </div>
  );
}

export default Landing;
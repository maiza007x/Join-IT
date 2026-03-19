import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await API.post("/auth/login", { username });
    localStorage.setItem("token", res.data.token);
    navigate("/tasks");
  };

  return (
    <div>
      <h2>Login</h2>
      <input onChange={e => setUsername(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
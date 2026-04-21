import { useEffect, useRef } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Toast } from "primereact/toast";
import Navbar from "../Navbar";
import socket from "../../services/socket";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const globalToast = useRef(null);

  const noNavbarPaths = ["/", "/login", "/register", "/forgot-password"];
  const shouldShowNavbar = !noNavbarPaths.includes(location.pathname);

  // --- Real-time Notification Listener ---
  useEffect(() => {
    socket.on("new-task", (data) => {
      globalToast.current?.show({
        severity: "info",
        summary: "📥 มีงานใหม่ในระบบ!",
        detail: (
          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-800">{data.deviceName}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{data.report}</div>
            <button
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-700 shadow-sm self-start"
              onClick={() => navigate("/tasks")}
            >
              ดูรายการงาน
            </button>
          </div>
        ),
        life: 10000, // แสดงนิ่งๆ 10 วินาที
      });
    });

    return () => {
      socket.off("new-task");
    };
  }, [navigate]);

  return (
    <>
      <Toast ref={globalToast} position="top-right" />
      {shouldShowNavbar && <Navbar />}
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;

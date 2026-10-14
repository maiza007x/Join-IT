import { useEffect, useRef } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Toast } from "primereact/toast";
import Navbar from "../Navbar";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import { getInternshipStatus } from "../../utils/internship";
import { formatThaiDate } from "../../utils/dateString";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const globalToast = useRef(null);
  const { user } = useAuth();
  const internship = getInternshipStatus(user);
  const outOfInternship = internship && (internship.ended || internship.notStarted);

  const noNavbarPaths = ["/", "/login", "/register", "/forgot-password"];
  const shouldShowNavbar = !noNavbarPaths.includes(location.pathname);

  // --- Real-time Notification Listener ---
  useEffect(() => {
    const handleNewTaskNotification = (data) => {
      // นอกช่วงฝึกงานไม่แจ้งเตือนงานใหม่ เพราะดูงานไม่ได้อยู่แล้ว
      if (outOfInternship) return;

      globalToast.current?.show({
        severity: "info",
        summary: "📥 มีงานใหม่ในระบบ!",
        detail: (
          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-800">{data.deviceName}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{data.report}</div>
            <button
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-700 shadow-sm self-start"
              onClick={() => navigate("/tasks", { state: { highlightTaskId: data.id } })}
            >
              ดูรายการงาน
            </button>
          </div>
        ),
        life: 10000, // แสดงนิ่งๆ 10 วินาที
      });
    };

    socket.on("new-task", handleNewTaskNotification);

    return () => {
      socket.off("new-task", handleNewTaskNotification);
    };
  }, [navigate, outOfInternship]);

  return (
    <>
      <Toast ref={globalToast} position="top-right" />
      {shouldShowNavbar && <Navbar />}
      {shouldShowNavbar && outOfInternship && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm font-semibold px-4 py-3 text-center">
          <i className="pi pi-info-circle mr-2"></i>
          {internship.ended ? "สิ้นสุดฝึกงานแล้ว" : "ยังไม่ถึงช่วงฝึกงาน"} จะดูงานได้เฉพาะช่วงเวลาที่ฝึกงานเท่านั้น
          ({formatThaiDate(internship.start)} - {formatThaiDate(internship.end)})
        </div>
      )}
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;

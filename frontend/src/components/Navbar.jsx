import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { confirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        confirmDialog({
            message: 'ต้องการออกจากระบบใช่หรือไม่?',
            header: 'ยืนยันการออกจากระบบ',
            icon: 'pi pi-power-off',
            acceptClassName: 'p-button-danger rounded-xl',
            accept: () => {
                logout();
                navigate("/", { replace: true });
            }
        });
    };

    const isActive = (path) => location.pathname === path;

    const PrimaryBtn = ({ icon, label, path }) => (
        <button
            onClick={() => navigate(path)}
            className={`p-3 md:px-5 md:py-2.5 rounded-2xl font-bold transition-all duration-300 flex items-center shadow-sm md:shadow-lg relative overflow-hidden
                ${isActive(path)
                    ? 'bg-blue-600 text-white shadow-blue-200'
                    : 'bg-[#1e293b] text-white hover:bg-slate-700 shadow-slate-200'}`}
        >
            <i className={`pi ${icon} md:mr-2 text-base md:text-sm ${isActive(path) ? 'animate-bounce' : ''}`}></i>
            <span className="hidden md:inline text-xs">{label}</span>
            {isActive(path) && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20"></div>
            )}
        </button>
    );

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 md:px-6 md:py-2">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">

                {/* --- ฝั่งซ้าย: โลโก้ --- */}
                <div className="flex items-center gap-2 md:gap-4 cursor-pointer min-w-0" onClick={() => navigate('/tasks')}>
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 md:p-2.5 rounded-2xl shadow-md shadow-blue-100 shrink-0">
                        <i className="pi pi-briefcase text-white text-lg md:text-xl"></i>
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-base md:text-lg font-black text-[#1e293b] leading-none tracking-tighter">JOIN-IT</h1>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1 text-nowrap">Operation Center</p>
                    </div>
                </div>

                {/* --- ฝั่งขวา: กลุ่มปุ่มเมนู --- */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">

                    {/* ปุ่มแดชบอร์ด */}
                    <PrimaryBtn icon="pi-th-large" label="แดชบอร์ด" path="/dashboard" />

                    {/* ปุ่มงานวันนี้ */}
                    <PrimaryBtn icon="pi-list" label="งานวันนี้" path="/tasks" />

                    {/* ปุ่มงานของฉัน */}
                    <PrimaryBtn icon="pi-user-edit" label="งานของฉัน" path="/my-tasks" />

                    {/* ปุ่มจัดการสมาชิก */}
                    <PrimaryBtn icon="pi-users" label="จัดการสมาชิก" path="/members" />

                    <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                    {/* โปรไฟล์ดึงจาก AuthContext */}
                    <div className="flex items-center gap-2 md:gap-3 bg-slate-50 p-1 md:pr-4 rounded-full border border-slate-100 cursor-pointer hover:bg-white transition-all shadow-sm"
                         onClick={() => navigate("/profile")}>
                        <div className="relative ml-0.5 md:ml-1">
                            <img
                                src={getImageUrl(user?.avatar_url)}
                                alt="Profile"
                                className="rounded-full object-cover border-2 border-white w-8 h-8 md:w-9 md:h-9 shadow-sm"
                            />
                            <div className="absolute bottom-0 right-[-2px] w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                        </div>
                        <span className="text-[11px] font-black text-slate-700 hidden lg:block mr-2">
                            {user?.username || 'User'}
                        </span>
                    </div>

                    {/* ปุ่มออกจากระบบ */}
                    <button onClick={handleLogout}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm shrink-0">
                        <i className="pi pi-power-off text-sm font-bold"></i>
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // เช็กว่าคนนี้เป็นแอดมินไหมจาก State user
    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.username?.toLowerCase() === 'admin';

    useEffect(() => {
        // ทุกครั้งที่เปิดเว็บขึ้นมาใหม่ หรือกด Refresh ให้มายิง API ตัวนี้
        const getMe = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // ยิงไปถามหลังบ้านเพื่อขอข้อมูลปัจจุบัน
                const response = await api.get("/users/me");
                // เปลี่ยนจากการแกะชั้นเดียว/สองชั้น ให้รองรับทั้งแบบมีและไม่มี wrapper "data"
                const userData = response.data.data || response.data;
                setUser(userData); 
            } catch (error) {
                console.error("Error fetching getMe:", error);
                // ถ้า Token หมดอายุ หรือมีปัญหา ให้เคลียร์ค่าทิ้ง
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getMe();
    }, []);

    // ฟังก์ชันตอน Login สำเร็จ (ให้เรียกใช้ในหน้า Login.jsx)
    const login = (userData, token) => {
        localStorage.setItem("token", token);
        setUser(userData);
    };

    // ฟังก์ชันตอน Logout
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
            {/* ตราบใดที่ยังโหลด getMe ไม่เสร็จ ไม่ต้องแสดงผลหน้าเว็บ (เพื่อป้องกันการกระพริบของสิทธิ์) */}
            {!loading ? children : (
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-slate-500 font-bold">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
};

// Custom Hook เพื่อเรียกใช้ง่ายๆ
export const useAuth = () => useContext(AuthContext);
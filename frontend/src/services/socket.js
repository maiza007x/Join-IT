import { io } from "socket.io-client";

// URL ของ Backend (ว่าง = origin เดียวกับหน้าเว็บ เช่น ผ่าน IIS proxy) และ path ตามที่โฮสต์ (/joinit/ + socket.io)
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || undefined;

const socket = io(SOCKET_URL, {
    path: `${import.meta.env.BASE_URL}socket.io`,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10, // จำกัดจำนวนครั้งที่พยายามเชื่อมต่อใหม่
    reconnectionDelay: 1000,
    // ใช้ polling อย่างเดียว เหมือน Order-IT: WebSocket ผ่าน IIS/ARR บนเซิร์ฟเวอร์นี้ handshake ไม่ผ่าน
    // (Incorrect Sec-WebSocket-Accept) polling ผ่าน HTTP ปกติและพอสำหรับการแจ้งงานใหม่
    transports: ["polling"],
});

export default socket;

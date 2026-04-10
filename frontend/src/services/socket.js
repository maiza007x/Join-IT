import { io } from "socket.io-client";

// URL ของ Backend API
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://172.16.39.6:5000";

const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
});

export default socket;

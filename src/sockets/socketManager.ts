import socketIOClient from "socket.io-client";

export const socket = socketIOClient(import.meta.env.VITE_SOCKET_URL);

export const disconnectSocket = () => {
    socket.disconnect();
}
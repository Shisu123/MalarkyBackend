import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// Store user's socket id
const userSocketMap = {};   // { userId: socketId }

io.on("connection", (socket) => {
    console.log("Connected to socket.io user: ", socket.id);

    // Get userId from query
    const { userId } = socket.handshake.query;
    if (userId) {
        // Store user's socket id
        userSocketMap[userId] = socket.id;
    }

    // Emit event to all connected clients
    io.emit("onlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("onlineUsers", Object.keys(userSocketMap));
    })
});

export { io, app, server };
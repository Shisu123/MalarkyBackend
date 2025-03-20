import express from 'express';  // Web Framework
import dotenv from 'dotenv';    // Environment Variables
import cookieParser from "cookie-parser";   // Extracts json data out of body
import cors from "cors";    // Cross-Origin Resource Sharing

import { connectDB } from './lib/db.js';               // Database Connection
import authRoutes from './routes/auth.route.js';    // Routes
import messageRoutes from './routes/message.route.js';  // Routes
import { app, server } from './lib/socket.js';      // Socket.io

dotenv.config();

const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set

app.use(express.json({ limit: "50mb"}));    // Middleware
app.use(cookieParser());    // Extracts json data out of body
app.use(cors({
    origin: ["http://localhost:5173", "https://main.d1tmmanuj6ct5v.amplifyapp.com"],
    credentials: true,
}));         

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on PORT: ${PORT}`);
    connectDB();
});

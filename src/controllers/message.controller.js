import { get } from "mongoose";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async(req, res) => {
    try {
        const loggedInUserId = req.user._id; // Get user id from request object

        // Tells Mongo to return all users except the logged in user.
        // Don't return password field, regardless if it's hashed.
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("ERROR [message.controller.js]: getUsersForSidebar controller failed.", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async(req, res) => {
    try {
        const {id:userToChatId} = req.params // id is from "/:id" in message.route.js
        const myId = req.user._id; // Get currently authenticated user id

        const messages = await Message.find({
            $or : [
                {senderId:myId, receiverId:userToChatId},   // senderId is the user sending the message
                {senderId:userToChatId, receiverId:myId}    // receiverId is the user receiving the message
            ]
        })

        res.status(200).json(messages); // Return messages
    } catch (error) {
        console.log("ERROR [message.controller.js]: getMessages controller failed.", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async(req, res) => {
    try {
        const { text, image } = req.body;       // Get text and image from request body
        const { id:receiverId } = req.params;   // Get receiver id from request params
        const senderId = req.user._id;

        let imageUrl;
        console.log("uploading image");
        if (image) {
            // Upload image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        // Define new message object
        const newMessage = new Message ({
            senderId,
            receiverId,
            text,
            image:imageUrl,
        });

        await newMessage.save();

        // Send message to receiver ONLY and check if receiver is online
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("ERROR [message.controller.js]: sendMessage controller failed.", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
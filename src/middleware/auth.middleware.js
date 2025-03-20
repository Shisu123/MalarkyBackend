import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		// Get token from cookies
		const token = req.cookies.jwt;
		if (!token) {
			return res.status(401).json({ message: "No token provided"})
		}

		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) {
			return res.status(401).json({ message: "Invalid token"})
		}

		// Check if user exists
		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			return res.status(401).json({ message: "User not found"})
		}

		// Set user in request object
		req.user = user;
		next();
	} catch (error) {
		console.log("ERROR [auth.middleware.js] protectRoute: ", error);
		res.status(500).json({ message: "Internal server error"});
	}
};
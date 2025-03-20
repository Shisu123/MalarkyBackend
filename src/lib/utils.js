import jwt from "jsonwebtoken";

export const generateToken= (userId, res) => {
	const token = jwt.sign({userId}, process.env.JWT_SECRET, {
		expiresIn: "3d"	// Requires user to login again after 3 days
	});

	// Store token in cookie and send to user
	res.cookie("jwt", token, {
		maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days in MS
		httpOnly: true, 	 // Prevents XSS attacks
		sameSite: "strict",  // Prevents CSRF attacks
		secure: process.env.NODE_ENV !== "development" // Only works in https
	})

	return token;
}
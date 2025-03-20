/* Imported so as not to clutter auth.routes.js */
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";	// Hashes passwords
import { generateToken } from "../lib/utils.js"; // import generatetoken from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
	const { fullName, email, password } = req.body;
	try {
		// Check if all fields are filled
		if (!fullName || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		// Check if password is at least 2 characters
		if (password.length < 2) {
			return res.status(400).json({ message: "Password must be at least 2 characters" });
		}

		// Check if user already exists
		const user = await User.findOne({ email })
		if (user) {
			return res.status(400).json({ message: "Email already exists" });
		}
		
		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create new user
		const newUser = new User({
			fullName,
			email,
			password: hashedPassword
		});

		if (newUser) {
			// Generate jwt token
			generateToken(newUser._id, res) // Note: _id is how MongoDB stores the id.
			await newUser.save();			// Save user to database.

			res.status(201).json({ message: "User created successfully" }); // 201 = created
		} else {
			return res.status(400).json({ message: "Failed to create user" });
		}
	} catch (error) {
		console.log("ERROR [auth.controller.js]: signup controller failed", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const login = async (req, res) => {
	const { email, password } = req.body
	try {
		// Check if user exists.
		// Note: findOne is a mongoose method that returns the first document that matches the query criteria.
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		// Check if password matches
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		generateToken(user._id, res); // Note: _id is how MongoDB stores the id.
		res.status(200).json({
			_id:user._id,
			fullName:user.fullName,
			email: user.email,
			profilePicture: user.profilePicture
		});
	} catch (error) {
		console.log("ERROR [auth.controller.js]: login controller failed.", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", {maxAge: 0})	// Clear cookie
		res.status(200).json({message: "Logged out successfully"});
	} catch (error) {
		console.log("ERROR [auth.controller.js]: logout controller failed.", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const {profilePicture} = req.body;	// Get profile picture from request body.
		const userId = req.user._id;	// Checks which user it is.

		if (!profilePicture) {
			return res.status(400).json({message: "Profile picture required"});
		}

		// Upload pfp to cloudinary
		// Not a DB, it's a bucket for images
		const uploadRes = await cloudinary.uploader.upload(profilePicture);
		const updatedUser = await User.findByIdAndUpdate(userId, {	// Update in DB.
			profilePicture: uploadRes.secure_url
		}, {new: true});	// Returns user after being updated

		res.status(200).json(updatedUser);
	} catch (error) {
		console.log("ERROR [auth.controller.js]: updateProfile controller failed.", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const checkAuth = (req, res) => {
	try {
		res.status(200).json(req.user);	// Returns user back to client
	} catch (error) {
		console.log("ERROR [auth.controller.js]: checkAuth controller failed.", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
}
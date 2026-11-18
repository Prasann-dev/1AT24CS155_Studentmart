const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const { JWT_SECRET, verifyToken } = require("../middleware/auth");
const router = express.Router();

// ==============================
// REGISTER (Student Registration)
// ==============================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Explicitly enforce student role for public registration
        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "student"
        });

        res.status(201).json({ 
            message: "Registration successful. You can now log in.",
            userId: newUser._id 
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
});

// ==============================
// STUDENT LOGIN
// ==============================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const role = user.role || "student";

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: role,
                usn: user.usn || "",
                phone: user.phone || "",
                imageUrl: user.imageUrl && user.imageUrl.length < 100000 ? user.imageUrl : ""
            }
        });
    } catch (error) {
        console.error("Login server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ==============================
// ADMIN LOGIN (Secured for Admin Portal)
// ==============================
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "Invalid administrator credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid administrator credentials" });
        }

        // Strictly verify administrator role on backend
        if (user.role !== "admin") {
            return res.status(403).json({ 
                message: "Access denied. This account does not have administrator privileges." 
            });
        }

        // Generate JWT token with admin role
        const token = jwt.sign(
            { id: user._id, email: user.email, role: "admin" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Administrator authenticated successfully",
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: "admin",
                usn: user.usn || "",
                phone: user.phone || "",
                imageUrl: user.imageUrl && user.imageUrl.length < 100000 ? user.imageUrl : ""
            }
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ==============================
// VERIFY TOKEN & GET CURRENT USER
// ==============================
router.get("/verify", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "student",
                usn: user.usn || "",
                phone: user.phone || "",
                imageUrl: user.imageUrl && user.imageUrl.length < 100000 ? user.imageUrl : ""
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error verifying token", error: error.message });
    }
});

// ==============================
// UPDATE PROFILE (Secure Fix)
// ==============================
router.put("/update/:id", async (req, res) => {
    try {
        const { name, email, usn, phone, password, imageUrl } = req.body;
        
        let updateData = { name, email, usn, phone, imageUrl };

        // Prevent users from tampering with their role
        delete updateData.role;

        if (password && password.trim() !== "" && password !== "••••••••") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { returnDocument: "after" } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role || "student",
                usn: updatedUser.usn,
                phone: updatedUser.phone,
                imageUrl: updatedUser.imageUrl
            }
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
});

module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../Models/User");
const router = express.Router();

// ==============================
// REGISTER
// ==============================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: name,
            email: email,
            password: hashedPassword
        });

        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ==============================
// LOGIN
// ==============================
router.post("/login", async (req, res) => {
    try {
        console.log("RECEIVED LOGIN DATA:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                usn: user.usn,
                phone: user.phone,
                // Safe check: Only send imageUrl if it's valid, otherwise default to empty string to prevent JSON overflow
                imageUrl: user.imageUrl && user.imageUrl.length < 100000 ? user.imageUrl : ""
            }
        });
    } catch (error) {
        console.error("Login server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ==============================
// UPDATE PROFILE (Secure Fix)
// ==============================
router.put("/update/:id", async (req, res) => {
    try {
        const { name, email, usn, phone, password, imageUrl } = req.body;
        
        let updateData = { name, email, usn, phone, imageUrl };

        if (password && password.trim() !== "" && password !== "••••••••") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                usn: updatedUser.usn,
                phone: updatedUser.phone,
                imageUrl: updatedUser.imageUrl
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
});

module.exports = router;
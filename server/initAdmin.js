const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./Models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studentmart";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Administrator";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@studentmart.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";

async function initializeAdmin() {
    try {
        console.log("Connecting to MongoDB at:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log(`User ${ADMIN_EMAIL} already exists.`);
            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                await existingAdmin.save();
                console.log(`Updated user ${ADMIN_EMAIL} role to 'admin'.`);
            } else {
                console.log(`User ${ADMIN_EMAIL} already has 'admin' role.`);
            }
        } else {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            const newAdmin = await User.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: "admin",
                usn: "ADMIN001",
                phone: "+91 9999999999",
                imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
            });
            console.log("Created initial administrator account successfully:");
            console.log(`  Name: ${newAdmin.name}`);
            console.log(`  Email: ${newAdmin.email}`);
            console.log(`  Role: ${newAdmin.role}`);
            console.log(`  Password: ${ADMIN_PASSWORD}`);
        }

        console.log("\nAdministrator initialization complete.");
        process.exit(0);
    } catch (error) {
        console.error("Failed to initialize administrator account:", error);
        process.exit(1);
    }
}

initializeAdmin();

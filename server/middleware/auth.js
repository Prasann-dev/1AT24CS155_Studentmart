const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const JWT_SECRET = process.env.JWT_SECRET || "studentmart_jwt_secret_key_2026";

/**
 * Middleware to verify JWT token from Authorization header
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Access denied. Token missing." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find user from DB to ensure they still exist and have up-to-date role
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User account no longer exists." });
        }

        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role || "student"
        };

        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({ message: "Invalid or expired session token. Please log in again." });
    }
};

/**
 * Middleware to ensure authenticated user has 'admin' role
 */
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ 
            message: "Access forbidden. Administrator privileges are required to perform this action." 
        });
    }
    next();
};

module.exports = {
    JWT_SECRET,
    verifyToken,
    verifyAdmin
};

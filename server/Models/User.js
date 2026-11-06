const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    usn: { type: String, default: "" }, // Make sure unique: true is NOT here
    phone: { type: String, default: "" },
    imageUrl: { type: String, default: "" } 
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
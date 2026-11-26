const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true
    },
    mobile: {
        type: String,
        required: [true, "Mobile number is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email address is required"],
        trim: true,
        lowercase: true
    },
    houseNo: {
        type: String,
        required: [true, "House/Flat/Building number is required"],
        trim: true
    },
    street: {
        type: String,
        required: [true, "Street/Area is required"],
        trim: true
    },
    landmark: {
        type: String,
        trim: true,
        default: ""
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true
    },
    state: {
        type: String,
        required: [true, "State is required"],
        trim: true
    },
    pincode: {
        type: String,
        required: [true, "PIN Code is required"],
        trim: true
    },
    alternatePhone: {
        type: String,
        trim: true,
        default: ""
    },
    location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        accuracy: { type: Number, default: null },
        mapUrl: { type: String, default: "" }
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Address", addressSchema);

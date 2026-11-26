const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number },
    imageUrl: { type: String, default: "" }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
    status: { type: String, required: true },
    comment: { type: String, default: "" },
    updatedBy: { type: String, default: "System" },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: { type: String, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    customer: {
        name: String,
        email: String,
        phone: String
    },
    deliveryAddress: {
        fullName: String,
        mobile: String,
        email: String,
        houseNo: String,
        street: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        alternatePhone: String,
        location: {
            latitude: Number,
            longitude: Number,
            accuracy: Number,
            mapUrl: String
        }
    },
    // Legacy fields preserved for backward compatibility
    invoiceNo: String,
    username: String,
    email: String,
    date: String,
    barcodeValue: String,
    total: Number,

    items: [orderItemSchema],
    totalItems: Number,
    subtotal: Number,
    deliveryCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: "" },
    finalTotal: Number,

    paymentMethod: { type: String, default: "Cash on Delivery" },
    paymentStatus: { type: String, default: "Pending" },
    orderStatus: {
        type: String,
        enum: ["Placed", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
        default: "Placed"
    },
    statusHistory: [statusHistorySchema],
    cancellationReason: { type: String, default: "" },
    cancelledAt: Date,
    deliveredAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);

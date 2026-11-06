const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    invoiceNo: String,
    username: String,
    email: String,
    date: String,
    items: Array,
    total: Number,
    barcodeValue: String
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
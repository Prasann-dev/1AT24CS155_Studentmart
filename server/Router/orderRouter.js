const express = require("express");
const router = express.Router();
const Order = require("../Models/Order");

// Save a new order
router.post("/", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.json(newOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get orders by email
router.get("/:email", async (req, res) => {
    try {
        const orders = await Order.find({ email: req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
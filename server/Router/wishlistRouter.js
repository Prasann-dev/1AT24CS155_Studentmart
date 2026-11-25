const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../Models/User");
const Product = require("../Models/Product");
const { verifyToken } = require("../middleware/auth");

// GET: Fetch current user's wishlist products
router.get("/", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("wishlist");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const items = (user.wishlist || []).filter(Boolean);
        res.json(items);
    } catch (error) {
        console.error("Fetch wishlist error:", error);
        res.status(500).json({ message: "Failed to fetch wishlist", error: error.message });
    }
});

// POST: Toggle product in wishlist
router.post("/toggle", verifyToken, async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Valid productId is required." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const currentList = user.wishlist || [];
        const exists = currentList.some((id) => id.toString() === productId.toString());

        if (exists) {
            user.wishlist = currentList.filter((id) => id.toString() !== productId.toString());
        } else {
            user.wishlist.push(product._id);
        }

        await user.save();
        await user.populate("wishlist");

        res.json({
            added: !exists,
            wishlist: (user.wishlist || []).filter(Boolean)
        });
    } catch (error) {
        console.error("Toggle wishlist error:", error);
        res.status(500).json({ message: "Failed to update wishlist", error: error.message });
    }
});

// DELETE: Remove product from wishlist
router.delete("/:productId", verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { wishlist: productId } },
            { returnDocument: "after" }
        ).populate("wishlist");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({
            message: "Removed from wishlist",
            wishlist: (user.wishlist || []).filter(Boolean)
        });
    } catch (error) {
        console.error("Remove wishlist error:", error);
        res.status(500).json({ message: "Failed to remove item from wishlist", error: error.message });
    }
});

module.exports = router;

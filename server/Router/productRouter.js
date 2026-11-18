const express = require("express");
const router = express.Router();
const Product = require("../Models/Product");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// ==========================================
// 1. GET: Fetch all products (Search, Filter, Sort)
// Public for all students and admins to browse
// ==========================================
router.get("/", async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        if (category && category !== "All") {
            query.category = category;
        }

        let sortOption = { createdAt: -1 };
        if (sort === "lowest") sortOption = { price: 1 };
        if (sort === "highest") sortOption = { price: -1 };
        if (sort === "newest") sortOption = { createdAt: -1 };

        const products = await Product.find(query).sort(sortOption);
        res.json(products);
    } catch (error) {
        console.error("Fetch products error:", error);
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
});

// ==========================================
// 2. GET: Dashboard Statistics (Admin Only)
// ==========================================
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const availableProducts = await Product.countDocuments({ stock: { $gt: 0 } });
        const outOfStock = await Product.countDocuments({ stock: { $lte: 0 } });
        
        // Distinct categories
        const categories = await Product.distinct("category");

        // Aggregation for total inventory valuation and average price
        const valuationData = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ["$price", { $ifNull: ["$stock", 1] }] } },
                    avgPrice: { $avg: "$price" }
                }
            }
        ]);

        const totalValue = valuationData.length > 0 ? Math.round(valuationData[0].totalValue) : 0;
        const avgPrice = valuationData.length > 0 ? Math.round(valuationData[0].avgPrice) : 0;

        res.json({
            totalProducts,
            availableProducts: availableProducts || totalProducts, // fallback if stock wasn't set
            outOfStock,
            totalCategories: categories.length,
            categories,
            totalInventoryValue: totalValue,
            averagePrice: avgPrice
        });
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ message: "Failed to fetch product stats", error: error.message });
    }
});

// ==========================================
// 3. GET: Fetch a single product for details view
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        console.error("Fetch product error:", error);
        res.status(500).json({ message: "Failed to fetch product details", error: error.message });
    }
});

// ==========================================
// 4. POST: Add a new product (Admin Only)
// ==========================================
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, description, price, category, imageUrl, stock } = req.body;

        if (!name || price === undefined || price === null || price === "") {
            return res.status(400).json({ message: "Product name and price are required." });
        }

        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ message: "Price must be a valid non-negative number." });
        }

        const parsedStock = stock !== undefined && stock !== "" ? Number(stock) : 10;
        if (isNaN(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ message: "Stock must be a valid non-negative number." });
        }

        const newProduct = new Product({
            name: name.trim(),
            description: (description || "").trim(),
            price: parsedPrice,
            category: category || "General",
            stock: parsedStock,
            imageUrl: imageUrl && imageUrl.trim() !== "" 
                ? imageUrl.trim() 
                : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("Add product error:", error);
        res.status(400).json({ message: "Failed to add product", error: error.message });
    }
});

// ==========================================
// 5. PUT: Update an existing product (Admin Only)
// ==========================================
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, description, price, category, imageUrl, stock } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (price !== undefined) {
            const parsedPrice = Number(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                return res.status(400).json({ message: "Price must be a valid non-negative number." });
            }
            updateData.price = parsedPrice;
        }
        if (category !== undefined) updateData.category = category;
        if (imageUrl !== undefined && imageUrl.trim() !== "") updateData.imageUrl = imageUrl.trim();
        if (stock !== undefined) {
            const parsedStock = Number(stock);
            if (isNaN(parsedStock) || parsedStock < 0) {
                return res.status(400).json({ message: "Stock must be a valid non-negative number." });
            }
            updateData.stock = parsedStock;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { returnDocument: "after", runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(400).json({ message: "Failed to update product", error: error.message });
    }
});

// ==========================================
// 6. DELETE: Delete a product (Admin Only)
// ==========================================
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: "Product removed successfully",
            productId: req.params.id,
            productName: deletedProduct.name
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Product = require("../Models/Product");

// 1. GET: Fetch all products with Search, Filter, and Sort capabilities
router.get("/", async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        let query = {};

        if (search) query.name = { $regex: search, $options: "i" };
        if (category && category !== "All") query.category = category;

        let sortOption = {};
        if (sort === "lowest") sortOption.price = 1;
        if (sort === "highest") sortOption.price = -1;

        const products = await Product.find(query).sort(sortOption);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. GET: Fetch a single product for details view
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. POST: Add a new product
router.post("/", async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
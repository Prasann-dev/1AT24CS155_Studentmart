const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import your routers
const authRouter = require("./Router/authRouter");
const productRouter = require("./Router/productRouter"); 
const orderRouter = require("./Router/orderRouter"); // Add this
app.use("/api/orders", orderRouter); // Add this// Added Product Router

// Use the routers
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter); // Added Product API route

app.get("/", (req, res) => {
    res.json({
        message: "StudentMart API is running"
    });
});

// Connect to MongoDB and start server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on http://localhost:${process.env.PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });
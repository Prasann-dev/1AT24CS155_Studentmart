const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const Address = require("../Models/Address");
const User = require("../Models/User");
const { JWT_SECRET, verifyToken, verifyAdmin } = require("../middleware/auth");

const VALID_STATUSES = [
    "Placed",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
];

function buildOrderLookupQuery(idOrCode) {
    if (mongoose.Types.ObjectId.isValid(idOrCode)) {
        return { $or: [{ orderId: idOrCode }, { invoiceNo: idOrCode }, { _id: idOrCode }] };
    }
    return { $or: [{ orderId: idOrCode }, { invoiceNo: idOrCode }] };
}

async function restoreOrderStock(items = []) {
    for (const item of items) {
        if (item.productId && item.quantity > 0) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity }
            });
        }
    }
}

// ==========================================
// 1. GET: Logged-in student's orders
// ==========================================
router.get("/my-orders", verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { user: req.user.id },
                { email: req.user.email },
                { "customer.email": req.user.email }
            ]
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Fetch my-orders error:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
});

// ==========================================
// 2. PUT: Student cancels their own order
// ==========================================
router.put("/my-orders/:orderId/cancel", verifyToken, async (req, res) => {
    try {
        const { reason } = req.body || {};
        const lookup = buildOrderLookupQuery(req.params.orderId);
        const order = await Order.findOne({
            ...lookup,
            $or: [
                { user: req.user.id },
                { email: req.user.email },
                { "customer.email": req.user.email }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        const currentStatus = order.orderStatus || "Placed";
        if (!["Placed", "Confirmed"].includes(currentStatus)) {
            return res.status(400).json({
                message: `Cannot cancel order in "${currentStatus}" status.`
            });
        }

        await restoreOrderStock(order.items);

        order.orderStatus = "Cancelled";
        order.cancellationReason = (reason && reason.trim()) || "Cancelled by customer";
        order.cancelledAt = new Date();
        order.statusHistory.push({
            status: "Cancelled",
            comment: order.cancellationReason,
            updatedBy: req.user.name || req.user.email
        });

        const updated = await order.save();
        res.json({ message: "Order cancelled successfully", order: updated });
    } catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({ message: "Failed to cancel order", error: error.message });
    }
});

// ==========================================
// 3. GET: Admin - List all orders with filters
// ==========================================
router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { search, status, dateFilter, sort } = req.query;
        const query = {};

        if (status && status !== "All") {
            query.orderStatus = status;
        }

        if (dateFilter && dateFilter !== "all") {
            const now = new Date();
            let startDate;
            if (dateFilter === "today") {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (dateFilter === "week") {
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (dateFilter === "month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }
            if (startDate) {
                query.createdAt = { $gte: startDate };
            }
        }

        if (search && search.trim()) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [
                { orderId: regex },
                { invoiceNo: regex },
                { username: regex },
                { email: regex },
                { "customer.name": regex },
                { "customer.email": regex },
                { "customer.phone": regex },
                { "deliveryAddress.fullName": regex },
                { "deliveryAddress.mobile": regex }
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };
        else if (sort === "highest") sortOption = { finalTotal: -1, total: -1 };
        else if (sort === "lowest") sortOption = { finalTotal: 1, total: 1 };

        const orders = await Order.find(query).sort(sortOption);
        res.json({ orders });
    } catch (error) {
        console.error("Admin fetch orders error:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
});

// ==========================================
// 4. GET: Admin - Order stats
// ==========================================
router.get("/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().select("orderStatus finalTotal total createdAt");
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const stats = {
            totalOrders: orders.length,
            placedOrders: 0,
            confirmedOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            outForDeliveryOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            todayOrders: 0,
            todayRevenue: 0
        };

        for (const order of orders) {
            const status = order.orderStatus || "Placed";
            const amount = Number(order.finalTotal ?? order.total ?? 0);
            const isToday = order.createdAt && new Date(order.createdAt) >= startOfToday;

            if (status === "Placed") stats.placedOrders++;
            else if (status === "Confirmed") stats.confirmedOrders++;
            else if (status === "Processing") stats.processingOrders++;
            else if (status === "Shipped") stats.shippedOrders++;
            else if (status === "Out for Delivery") stats.outForDeliveryOrders++;
            else if (status === "Delivered") stats.deliveredOrders++;
            else if (status === "Cancelled") stats.cancelledOrders++;

            if (status !== "Cancelled") {
                stats.totalRevenue += amount;
            }
            if (isToday) {
                stats.todayOrders++;
                if (status !== "Cancelled") {
                    stats.todayRevenue += amount;
                }
            }
        }

        res.json(stats);
    } catch (error) {
        console.error("Admin order stats error:", error);
        res.status(500).json({ message: "Failed to fetch order stats", error: error.message });
    }
});

// ==========================================
// 5. PUT: Admin - Update order status
// ==========================================
router.put("/admin/:orderId/status", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status, comment } = req.body;
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Invalid order status." });
        }

        const order = await Order.findOne(buildOrderLookupQuery(req.params.orderId));
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        const prevStatus = order.orderStatus || "Placed";
        if (status === "Cancelled" && prevStatus !== "Cancelled") {
            await restoreOrderStock(order.items);
            order.cancelledAt = new Date();
            order.cancellationReason = comment || "Cancelled by administrator";
        }

        if (status === "Delivered") {
            order.deliveredAt = new Date();
            order.paymentStatus = "Completed";
        }

        order.orderStatus = status;
        order.statusHistory.push({
            status,
            comment: comment || `Status updated to ${status}`,
            updatedBy: req.user.name || "Administrator"
        });

        const updated = await order.save();
        res.json({ message: "Order status updated", order: updated });
    } catch (error) {
        console.error("Admin update order status error:", error);
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    }
});

// ==========================================
// 6. POST: Place a new order (supports both Checkout flow & legacy quick order)
// ==========================================
router.post("/", async (req, res) => {
    try {
        // Checkout flow payload: { addressId, paymentMethod, items: [{ productId, quantity }] }
        if (req.body.addressId) {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Access denied. Please log in to place an order." });
            }

            const token = authHeader.split(" ")[1];
            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return res.status(401).json({ message: "Invalid or expired session token." });
            }

            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                return res.status(401).json({ message: "User account no longer exists." });
            }

            const { addressId, paymentMethod = "Cash on Delivery", items, promoCode = "" } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: "Your cart is empty." });
            }

            const address = await Address.findOne({ _id: addressId, user: user._id });
            if (!address) {
                return res.status(404).json({ message: "Selected delivery address not found." });
            }

            const orderItems = [];
            let subtotal = 0;
            let totalItems = 0;

            for (const entry of items) {
                const qty = Math.max(1, parseInt(entry.quantity, 10) || 1);
                const product = await Product.findById(entry.productId);
                if (!product) {
                    return res.status(404).json({ message: "One or more products in your cart no longer exist." });
                }
                if (typeof product.stock === "number" && product.stock < qty) {
                    return res.status(400).json({
                        message: `Insufficient stock for "${product.name}". Only ${product.stock} left.`
                    });
                }

                const lineSubtotal = Number(product.price) * qty;
                subtotal += lineSubtotal;
                totalItems += qty;

                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    price: Number(product.price),
                    quantity: qty,
                    subtotal: lineSubtotal,
                    imageUrl: product.imageUrl || ""
                });
            }

            // Deduct stock after verifying all items
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity }
                });
            }

            const deliveryCharges = subtotal >= 500 ? 0 : 40;
            const normalizedPromo = String(promoCode || "").trim().toUpperCase();
            const discount = normalizedPromo === "STUDENT10" ? Math.round(subtotal * 0.1) : 0;
            const finalTotal = Math.max(0, subtotal + deliveryCharges - discount);
            const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

            const newOrder = new Order({
                orderId,
                invoiceNo: orderId,
                user: user._id,
                username: user.name,
                email: user.email,
                customer: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone || address.mobile
                },
                deliveryAddress: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    email: address.email,
                    houseNo: address.houseNo,
                    street: address.street,
                    landmark: address.landmark || "",
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    alternatePhone: address.alternatePhone || ""
                },
                items: orderItems,
                totalItems,
                subtotal,
                deliveryCharges,
                discount,
                promoCode: discount > 0 ? normalizedPromo : "",
                finalTotal,
                total: finalTotal,
                paymentMethod,
                paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Completed",
                orderStatus: "Placed",
                statusHistory: [{
                    status: "Placed",
                    comment: "Order placed successfully by customer",
                    updatedBy: user.name || user.email
                }]
            });

            const savedOrder = await newOrder.save();
            return res.status(201).json({
                message: "Order placed successfully",
                order: savedOrder
            });
        }

        // Legacy quick order payload
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.json(newOrder);
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// 7. GET: Legacy orders by email
// ==========================================
router.get("/:email", async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { email: req.params.email },
                { "customer.email": req.params.email }
            ]
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

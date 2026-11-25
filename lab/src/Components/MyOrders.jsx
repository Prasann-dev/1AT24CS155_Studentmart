import { useState, useEffect, useCallback } from "react";

// Status progression order for the tracking timeline
const TIMELINE_STEPS = [
    { key: "Placed", label: "Order Placed", desc: "Your order has been received" },
    { key: "Confirmed", label: "Confirmed", desc: "Order confirmed by store" },
    { key: "Processing", label: "Processing", desc: "Packed & ready for dispatch" },
    { key: "Shipped", label: "Shipped", desc: "In transit with delivery partner" },
    { key: "Out for Delivery", label: "Out for Delivery", desc: "Arriving at your location today" },
    { key: "Delivered", label: "Delivered", desc: "Package handed over safely" }
];

export default function MyOrders({ token, setActiveTab }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    const PORT = 5002;
    const authToken = token || localStorage.getItem("token");

    const getHeaders = useCallback(() => ({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
    }), [authToken]);

    const fetchUserOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:${PORT}/api/orders/my-orders`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            } else {
                console.error("Failed to load orders:", res.statusText);
            }
        } catch (error) {
            console.error("Fetch orders error:", error);
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    useEffect(() => {
        let active = true;
        fetch(`http://localhost:${PORT}/api/orders/my-orders`, {
            headers: getHeaders()
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && data) {
                    setOrders(Array.isArray(data) ? data : []);
                }
            })
            .catch((error) => {
                console.error("Fetch orders error:", error);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [getHeaders]);

    const showFeedback = (type, text) => {
        setFeedbackMessage({ type, text });
        setTimeout(() => setFeedbackMessage(null), 4000);
    };

    // Cancellation Handler
    const handleConfirmCancel = async () => {
        if (!cancellingOrder) return;
        setIsCancelling(true);
        try {
            const orderId = cancellingOrder.orderId || cancellingOrder._id;
            const res = await fetch(`http://localhost:${PORT}/api/orders/my-orders/${orderId}/cancel`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ reason: cancelReason || "Cancelled by customer" })
            });

            const data = await res.json();
            if (res.ok) {
                showFeedback("success", "Order cancelled successfully. Stock has been restored.");
                setCancellingOrder(null);
                setCancelReason("");
                // Refresh list & updated modal if open
                await fetchUserOrders();
                if (selectedOrder && (selectedOrder.orderId === orderId || selectedOrder._id === orderId)) {
                    setSelectedOrder(data.order);
                }
            } else {
                showFeedback("error", data.message || "Could not cancel order.");
            }
        } catch (error) {
            console.error("Cancellation error:", error);
            showFeedback("error", "Error connecting to server. Please try again.");
        } finally {
            setIsCancelling(false);
        }
    };

    // Filter logic
    const filteredOrders = orders.filter((order) => {
        const orderId = (order.orderId || order.invoiceNo || order._id || "").toLowerCase();
        const matchesSearch = !searchTerm.trim() || 
            orderId.includes(searchTerm.toLowerCase().trim()) ||
            (order.items && order.items.some(i => i.name && i.name.toLowerCase().includes(searchTerm.toLowerCase().trim())));

        if (!matchesSearch) return false;

        if (statusFilter === "All") return true;
        const effectiveStatus = order.orderStatus || "Placed";
        if (statusFilter === "Active") {
            return ["Placed", "Confirmed", "Processing", "Shipped", "Out for Delivery"].includes(effectiveStatus);
        }
        return effectiveStatus === statusFilter;
    });

    // Helper for Status Badge Styling
    const getStatusBadge = (status) => {
        switch (status) {
            case "Placed":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "Confirmed":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "Processing":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "Shipped":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "Out for Delivery":
                return "bg-orange-50 text-orange-700 border-orange-200";
            case "Delivered":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Cancelled":
                return "bg-rose-50 text-rose-700 border-rose-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getTimelineStepIndex = (status) => {
        return TIMELINE_STEPS.findIndex(s => s.key === status);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(dateString));
    };

    return (
        <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4 space-y-6">
            {/* Header & Controls */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                My Orders
                            </h1>
                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
                                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            Track shipments, view itemized receipts, and manage your purchase history.
                        </p>
                    </div>

                    <button
                        onClick={() => setActiveTab("products")}
                        className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm flex items-center gap-2 self-start md:self-auto"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        <span>Browse Campus Store</span>
                    </button>
                </div>

                {/* Feedback Toast */}
                {feedbackMessage && (
                    <div className={`mt-4 p-4 rounded-2xl text-sm flex items-center justify-between ${
                        feedbackMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                        <span>{feedbackMessage.text}</span>
                        <button onClick={() => setFeedbackMessage(null)} className="text-xs font-bold ml-4">✕</button>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search by Order ID or item name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 bg-gray-50/50 transition"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {["All", "Active", "Delivered", "Cancelled"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                    statusFilter === tab
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List Container */}
            {loading ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm text-gray-400">
                    <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <p className="text-sm font-semibold">Loading your orders...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
                    <p className="text-gray-500 text-xs mb-6">
                        {searchTerm || statusFilter !== "All"
                            ? "No orders match your filter criteria."
                            : "You haven't placed any orders on StudentMart yet."}
                    </p>
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("All");
                            setActiveTab("products");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-sm"
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredOrders.map((order) => {
                        const orderId = order.orderId || order.invoiceNo || order._id;
                        const items = order.items || [];
                        const orderStatus = order.orderStatus || "Placed";
                        const currentStepIndex = getTimelineStepIndex(orderStatus);
                        const isCancelled = orderStatus === "Cancelled";
                        const canCancel = orderStatus === "Placed" || orderStatus === "Confirmed";

                        return (
                            <div
                                key={order._id || orderId}
                                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Top Header Bar */}
                                <div className="p-5 sm:p-6 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">ORDER ID</span>
                                            <span className="font-mono font-extrabold text-gray-900 text-sm sm:text-base">{orderId}</span>
                                        </div>
                                        <div className="hidden sm:block text-gray-300">|</div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">DATE PLACED</span>
                                            <span className="text-xs font-semibold text-gray-700">{formatDate(order.createdAt || order.date)}</span>
                                        </div>
                                        <div className="hidden sm:block text-gray-300">|</div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">TOTAL AMOUNT</span>
                                            <span className="font-extrabold text-blue-600 text-base">₹{order.finalTotal || order.total}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge & Actions */}
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getStatusBadge(orderStatus)}`}>
                                            ● {orderStatus}
                                        </span>

                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-3 py-1.5 rounded-xl text-xs border border-gray-200 transition shadow-sm"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>

                                {/* Order Tracking Progress Timeline */}
                                <div className="p-6 bg-white border-b border-gray-100">
                                    <div className="mb-2">
                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                                            SHIPMENT PROGRESS
                                        </span>
                                    </div>

                                    {isCancelled ? (
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    ✕
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-rose-900">Order Cancelled</h4>
                                                    <p className="text-xs text-rose-600">
                                                        Reason: {order.cancellationReason || "Cancelled by request"}
                                                        {order.cancelledAt && ` · on ${formatDate(order.cancelledAt)}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-rose-700 bg-white px-3 py-1 rounded-xl border border-rose-200">
                                                Closed
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="py-3">
                                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-0 relative">
                                                {TIMELINE_STEPS.map((step, idx) => {
                                                    const isCompleted = currentStepIndex >= idx;
                                                    const isCurrent = currentStepIndex === idx;

                                                    return (
                                                        <div key={step.key} className="flex flex-col items-center text-center relative px-1">
                                                            {/* Step Circle */}
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                                                                isCurrent
                                                                    ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md"
                                                                    : isCompleted
                                                                    ? "bg-emerald-600 text-white"
                                                                    : "bg-gray-100 text-gray-400 border border-gray-200"
                                                            }`}>
                                                                {isCompleted && !isCurrent ? "✓" : idx + 1}
                                                            </div>

                                                            {/* Label */}
                                                            <p className={`text-[11px] font-bold mt-2 leading-tight ${
                                                                isCurrent ? "text-blue-600" : isCompleted ? "text-gray-900" : "text-gray-400"
                                                            }`}>
                                                                {step.label}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 hidden sm:block mt-0.5 line-clamp-1">
                                                                {step.desc}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Items Preview Section */}
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3.5">
                                                    <img
                                                        src={item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=80"}
                                                        alt={item.name}
                                                        className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Qty: <span className="font-semibold text-gray-800">{item.quantity}</span> × ₹{item.price}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-extrabold text-gray-900 text-sm">
                                                    ₹{item.subtotal || (item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Card Footer: Delivery info & Cancellation */}
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
                                        <div>
                                            Delivery to: <strong className="text-gray-800">{order.deliveryAddress?.fullName || order.customer?.name}</strong>
                                            {order.deliveryAddress?.city && ` (${order.deliveryAddress.city})`} · Payment via <strong className="text-gray-800">{order.paymentMethod || "COD"}</strong>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {canCancel && (
                                                <button
                                                    onClick={() => {
                                                        setCancellingOrder(order);
                                                        setCancelReason("");
                                                    }}
                                                    className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition"
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-blue-600 hover:text-blue-800 font-bold"
                                            >
                                                View Full Receipt →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL 1: FULL ORDER DETAILS / RECEIPT */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">ORDER DETAILS</span>
                                <h3 className="text-xl font-extrabold text-gray-900 font-mono">
                                    {selectedOrder.orderId || selectedOrder.invoiceNo || selectedOrder._id}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Order Status & Date */}
                        <div className="my-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="text-xs text-gray-500 block">Status:</span>
                                <span className={`inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(selectedOrder.orderStatus || "Placed")}`}>
                                    ● {selectedOrder.orderStatus || "Placed"}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">Payment Mode:</span>
                                <span className="text-xs font-bold text-gray-900 mt-1 block">
                                    {selectedOrder.paymentMethod || "Cash on Delivery"} ({selectedOrder.paymentStatus || "Pending"})
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">Placed On:</span>
                                <span className="text-xs font-semibold text-gray-800 mt-1 block">
                                    {formatDate(selectedOrder.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="mb-6">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">DELIVERY ADDRESS</h4>
                            {selectedOrder.deliveryAddress?.houseNo ? (
                                <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                                    <p className="font-bold text-gray-900 text-sm mb-1">
                                        {selectedOrder.deliveryAddress?.fullName || selectedOrder.customer?.name}
                                    </p>
                                    <p>
                                        {selectedOrder.deliveryAddress?.houseNo}, {selectedOrder.deliveryAddress?.street}
                                        {selectedOrder.deliveryAddress?.landmark ? `, Near ${selectedOrder.deliveryAddress.landmark}` : ""}
                                    </p>
                                    <p>
                                        {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - <strong>{selectedOrder.deliveryAddress?.pincode}</strong>
                                    </p>
                                    <p className="mt-1 text-gray-500">
                                        Mobile: <strong className="text-gray-800">{selectedOrder.deliveryAddress?.mobile || selectedOrder.customer?.phone}</strong>
                                        {selectedOrder.deliveryAddress?.alternatePhone && ` | Alt: ${selectedOrder.deliveryAddress.alternatePhone}`}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-100 text-xs text-gray-500">
                                    Legacy order ({selectedOrder.username || selectedOrder.email}) — no delivery address recorded.
                                </div>
                            )}
                        </div>

                        {/* Purchased Items Table */}
                        <div className="mb-6">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">PURCHASED PRODUCTS</h4>
                            <div className="divide-y divide-gray-100 border rounded-2xl overflow-hidden">
                                {(selectedOrder.items || []).map((item, i) => (
                                    <div key={i} className="p-3.5 flex items-center justify-between text-xs bg-white">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=80"}
                                                alt={item.name}
                                                className="w-10 h-10 object-cover rounded-lg border bg-white shrink-0"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                <p className="text-gray-500">₹{item.price} × {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="font-extrabold text-gray-900 text-sm">
                                            ₹{item.subtotal || (item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bill Breakdown */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-900">₹{selectedOrder.subtotal ?? selectedOrder.total ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-gray-900">
                                    {selectedOrder.deliveryCharges > 0 ? `₹${selectedOrder.deliveryCharges}` : <span className="text-green-600 font-bold">FREE</span>}
                                </span>
                            </div>
                            {selectedOrder.discount > 0 && (
                                <div className="flex justify-between text-green-600 font-semibold">
                                    <span>Discount</span>
                                    <span>- ₹{selectedOrder.discount}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-extrabold text-gray-900">
                                <span>Total Payable</span>
                                <span className="text-xl text-blue-600">₹{selectedOrder.finalTotal || selectedOrder.total}</span>
                            </div>
                        </div>

                        {/* Status Activity Log */}
                        {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">STATUS TIMELINE LOG</h4>
                                <div className="space-y-2 border rounded-2xl p-4 bg-white">
                                    {selectedOrder.statusHistory.map((hist, i) => (
                                        <div key={i} className="flex items-start gap-3 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0"></span>
                                            <div>
                                                <p className="font-bold text-gray-900">{hist.status} <span className="text-[10px] text-gray-400 font-normal">by {hist.updatedBy}</span></p>
                                                {hist.comment && <p className="text-gray-500 mt-0.5">{hist.comment}</p>}
                                                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(hist.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                            >
                                Close
                            </button>
                            {((selectedOrder.orderStatus || "Placed") === "Placed" || selectedOrder.orderStatus === "Confirmed") && (
                                <button
                                    onClick={() => {
                                        setCancellingOrder(selectedOrder);
                                        setCancelReason("");
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-xs border border-red-200 transition"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: CONFIRM CANCELLATION DIALOG */}
            {cancellingOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">Cancel Order?</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                            Are you sure you want to cancel order <strong>{cancellingOrder.orderId || cancellingOrder._id}</strong>? The reserved inventory stock will be released back to the store.
                        </p>

                        <div className="mt-4">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Reason for cancellation (Optional)
                            </label>
                            <textarea
                                rows="3"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="e.g. Ordered by mistake, bought from elsewhere..."
                                className="w-full p-3 rounded-xl border border-gray-300 text-xs outline-none focus:border-red-500 resize-none transition"
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setCancellingOrder(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                            >
                                No, Keep Order
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                            >
                                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

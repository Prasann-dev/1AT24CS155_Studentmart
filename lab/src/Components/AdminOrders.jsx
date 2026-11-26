import { useState, useEffect, useCallback } from "react";

export default function AdminOrders({ token }) {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
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
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters and Search
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortOption, setSortOption] = useState("newest");

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusUpdateVal, setStatusUpdateVal] = useState("");
    const [statusComment, setStatusComment] = useState("");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [notification, setNotification] = useState(null); // { type, message }

    const PORT = 5002;
    const adminToken = token || localStorage.getItem("token");

    const getHeaders = useCallback(() => ({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
    }), [adminToken]);

    const showNotify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4500);
    };

    const fetchAdminOrders = useCallback(async () => {
        setLoading(true);
        try {
            let url = `http://localhost:${PORT}/api/orders/admin/all?`;
            if (submittedSearch.trim()) url += `search=${encodeURIComponent(submittedSearch.trim())}&`;
            if (statusFilter !== "All") url += `status=${encodeURIComponent(statusFilter)}&`;
            if (dateFilter !== "all") url += `dateFilter=${encodeURIComponent(dateFilter)}&`;
            if (sortOption) url += `sort=${encodeURIComponent(sortOption)}&`;

            const res = await fetch(url, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            } else {
                console.error("Failed to load admin orders:", res.statusText);
            }
        } catch (error) {
            console.error("Admin orders fetch error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [submittedSearch, statusFilter, dateFilter, sortOption, getHeaders]);

    const fetchOrderStats = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:${PORT}/api/orders/admin/stats`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Admin stats error:", error);
        }
    }, [getHeaders]);

    useEffect(() => {
        let active = true;
        let url = `http://localhost:${PORT}/api/orders/admin/all?`;
        if (submittedSearch.trim()) url += `search=${encodeURIComponent(submittedSearch.trim())}&`;
        if (statusFilter !== "All") url += `status=${encodeURIComponent(statusFilter)}&`;
        if (dateFilter !== "all") url += `dateFilter=${encodeURIComponent(dateFilter)}&`;
        if (sortOption) url += `sort=${encodeURIComponent(sortOption)}&`;

        fetch(url, { headers: getHeaders() })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && data) setOrders(data.orders || []);
            })
            .catch((error) => {
                console.error("Admin orders fetch error:", error);
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                    setRefreshing(false);
                }
            });

        fetch(`http://localhost:${PORT}/api/orders/admin/stats`, {
            headers: getHeaders()
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && data) setStats(data);
            })
            .catch((error) => {
                console.error("Admin stats error:", error);
            });

        return () => { active = false; };
    }, [submittedSearch, statusFilter, dateFilter, sortOption, getHeaders]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (submittedSearch === search) {
            fetchAdminOrders();
        } else {
            setSubmittedSearch(search);
        }
    };

    // Update Status Handler
    const handleUpdateStatus = async (orderId, targetStatus, commentText = "") => {
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`http://localhost:${PORT}/api/orders/admin/${orderId}/status`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({
                    status: targetStatus,
                    comment: commentText || statusComment || `Status updated to ${targetStatus} by Administrator`
                })
            });

            const data = await res.json();
            if (res.ok) {
                showNotify("success", `Order #${orderId} status updated to "${targetStatus}".`);
                setStatusComment("");
                // Refresh list and stats
                await fetchAdminOrders();
                await fetchOrderStats();
                // If modal is open for this order, refresh modal
                if (selectedOrder && (selectedOrder.orderId === orderId || selectedOrder._id === orderId)) {
                    setSelectedOrder(data.order);
                    setStatusUpdateVal(data.order.orderStatus);
                }
            } else {
                showNotify("error", data.message || "Failed to update order status.");
            }
        } catch (error) {
            console.error("Update status error:", error);
            showNotify("error", "Error connecting to server. Please try again.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Open detail modal
    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setStatusUpdateVal(order.orderStatus || "Placed");
        setStatusComment("");
    };

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

    const allStatuses = [
        "Placed",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled"
    ];

    return (
        <div className="space-y-8">
            {/* Notification alert */}
            {notification && (
                <div className={`p-4 rounded-2xl text-sm flex items-center justify-between shadow-sm border ${
                    notification.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
                }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === "success" ? "✓" : "⚠"}
                        <span className="font-semibold">{notification.message}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-xs font-bold ml-4">✕</button>
                </div>
            )}

            {/* Top Metric Cards (5 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Orders */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL ORDERS</p>
                            <h3 className="text-2xl font-black text-gray-900 my-1">{stats.totalOrders}</h3>
                            <p className="text-xs text-blue-600 font-semibold">{stats.todayOrders} placed today</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Placed / New Orders */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">NEW / PLACED</p>
                            <h3 className="text-2xl font-black text-blue-600 my-1">{stats.placedOrders}</h3>
                            <p className="text-xs text-gray-500 font-medium">Awaiting store review</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                        </div>
                    </div>
                </div>

                {/* Processing & In-Transit */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">IN PROGRESS</p>
                            <h3 className="text-2xl font-black text-amber-600 my-1">
                                {(stats.confirmedOrders || 0) + (stats.processingOrders || 0) + (stats.shippedOrders || 0) + (stats.outForDeliveryOrders || 0)}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">{stats.shippedOrders} shipped / transit</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect width="16" height="10" x="1" y="3" rx="2"/><path d="M17 8h4l3 3v2h-7V8z"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Delivered */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">DELIVERED</p>
                            <h3 className="text-2xl font-black text-emerald-600 my-1">{stats.deliveredOrders}</h3>
                            <p className="text-xs text-rose-500 font-medium">{stats.cancelledOrders} cancelled</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL REVENUE</p>
                            <h3 className="text-2xl font-black text-gray-900 my-1">₹{stats.totalRevenue}</h3>
                            <p className="text-xs text-emerald-600 font-semibold">+₹{stats.todayRevenue} today</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            ₹
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter, Search & Action Bar */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search by Order ID, Customer Name, Email, or Phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 bg-gray-50/50 transition"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1.5 bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                        >
                            Search
                        </button>
                    </form>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                            <span className="text-[11px] font-bold text-gray-500 uppercase">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                            <span className="text-[11px] font-bold text-gray-500 uppercase">Date:</span>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                            <span className="text-[11px] font-bold text-gray-500 uppercase">Sort:</span>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Amount: High to Low</option>
                                <option value="lowest">Amount: Low to High</option>
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={() => {
                                setRefreshing(true);
                                fetchAdminOrders();
                                fetchOrderStats();
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            title="Refresh orders"
                        >
                            <svg className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Customer Orders Table</h2>
                        <p className="text-xs text-gray-500">
                            Showing {orders.length} order records based on current filters
                        </p>
                    </div>
                    {statusFilter !== "All" && (
                        <button
                            onClick={() => {
                                setStatusFilter("All");
                                setSearch("");
                                setSubmittedSearch("");
                                setDateFilter("all");
                            }}
                            className="text-xs text-blue-600 hover:underline font-bold"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <p className="text-sm font-semibold">Loading orders data...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            </svg>
                        </div>
                        <h4 className="text-base font-bold text-gray-800">No Orders Found</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            No orders match the current filter or search criteria. Try modifying your search or reset filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                    <th className="py-3.5 px-4">Order ID</th>
                                    <th className="py-3.5 px-4">Customer</th>
                                    <th className="py-3.5 px-4">Mobile Number</th>
                                    <th className="py-3.5 px-4">Order Date</th>
                                    <th className="py-3.5 px-4">Total Items</th>
                                    <th className="py-3.5 px-4">Total Amount</th>
                                    <th className="py-3.5 px-4">Payment</th>
                                    <th className="py-3.5 px-4">Order Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                {orders.map((order) => {
                                    const orderId = order.orderId || order.invoiceNo || order._id;
                                    const custName = order.customer?.name || order.deliveryAddress?.fullName || order.username || "Customer";
                                    const custEmail = order.customer?.email || order.deliveryAddress?.email || order.email || "No email";
                                    const custPhone = order.customer?.phone || order.deliveryAddress?.mobile || "N/A";
                                    const itemsCount = order.totalItems || (order.items ? order.items.length : 0);
                                    const currentStatus = order.orderStatus || "Placed";

                                    return (
                                        <tr key={order._id || orderId} className="hover:bg-blue-50/30 transition">
                                            {/* Order ID */}
                                            <td className="py-4 px-4 font-mono font-bold text-gray-900">
                                                <button
                                                    onClick={() => openOrderDetails(order)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {orderId}
                                                </button>
                                            </td>

                                            {/* Customer Name & Email */}
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-gray-900">{custName}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{custEmail}</p>
                                            </td>

                                            {/* Mobile Number */}
                                            <td className="py-4 px-4 font-semibold text-gray-800">
                                                {custPhone}
                                            </td>

                                            {/* Order Date */}
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                                                {formatDate(order.createdAt || order.date)}
                                            </td>

                                            {/* Total Items */}
                                            <td className="py-4 px-4 font-bold text-gray-800">
                                                {itemsCount} {itemsCount === 1 ? "item" : "items"}
                                            </td>

                                            {/* Total Amount */}
                                            <td className="py-4 px-4 font-extrabold text-blue-600 text-sm whitespace-nowrap">
                                                ₹{order.finalTotal || order.total}
                                            </td>

                                            {/* Payment */}
                                            <td className="py-4 px-4">
                                                <p className="font-semibold text-gray-800">{order.paymentMethod || "COD"}</p>
                                                <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-md ${
                                                    order.paymentStatus === "Completed"
                                                        ? "bg-green-50 text-green-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}>
                                                    {order.paymentStatus || "Pending"}
                                                </span>
                                            </td>

                                            {/* Order Status with Quick Change */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <select
                                                    value={currentStatus}
                                                    onChange={(e) => handleUpdateStatus(orderId, e.target.value)}
                                                    disabled={isUpdatingStatus}
                                                    className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border outline-none cursor-pointer transition ${getStatusBadge(currentStatus)}`}
                                                >
                                                    {allStatuses.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openOrderDetails(order)}
                                                        className="bg-[#eef5f2] hover:bg-[#dfeee6] text-[#1d5e4b] font-bold px-3 py-1.5 rounded-xl text-xs transition"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ORDER DETAILS MODAL (ADMIN) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-200">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">ADMIN ORDER VIEW</span>
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

                        {/* Status Updater Section in Modal */}
                        <div className="my-6 p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900">Manage Order Status</h4>
                                    <p className="text-xs text-blue-700">
                                        Update workflow status. Changes immediately reflect in user's "My Orders".
                                    </p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${getStatusBadge(selectedOrder.orderStatus || "Placed")}`}>
                                    Current: {selectedOrder.orderStatus || "Placed"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                <div className="sm:col-span-5">
                                    <select
                                        value={statusUpdateVal}
                                        onChange={(e) => setStatusUpdateVal(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
                                    >
                                        {allStatuses.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-4">
                                    <input
                                        type="text"
                                        placeholder="Optional note / comment..."
                                        value={statusComment}
                                        onChange={(e) => setStatusComment(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <button
                                        onClick={() => handleUpdateStatus(
                                            selectedOrder.orderId || selectedOrder._id,
                                            statusUpdateVal,
                                            statusComment
                                        )}
                                        disabled={isUpdatingStatus}
                                        className="w-full bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                                    >
                                        {isUpdatingStatus ? "Updating..." : "Update Status"}
                                    </button>
                                </div>
                            </div>

                            {/* Quick Action Shortcuts */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100/80">
                                <span className="text-[11px] font-bold text-blue-800">Quick Actions:</span>
                                {(selectedOrder.orderStatus || "Placed") === "Placed" && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId || selectedOrder._id, "Confirmed", "Order confirmed by admin")}
                                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                                    >
                                        ✓ Confirm Order
                                    </button>
                                )}
                                {["Placed", "Confirmed"].includes(selectedOrder.orderStatus || "Placed") && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId || selectedOrder._id, "Processing", "Order is being packed")}
                                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                                    >
                                        📦 Mark Processing
                                    </button>
                                )}
                                {["Confirmed", "Processing"].includes(selectedOrder.orderStatus) && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId || selectedOrder._id, "Shipped", "Handed over to delivery agent")}
                                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                                    >
                                        🚚 Mark Shipped
                                    </button>
                                )}
                                {selectedOrder.orderStatus === "Shipped" && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId || selectedOrder._id, "Out for Delivery", "Out with delivery agent")}
                                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                                    >
                                        🛵 Mark Out for Delivery
                                    </button>
                                )}
                                {selectedOrder.orderStatus !== "Delivered" && selectedOrder.orderStatus !== "Cancelled" && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId || selectedOrder._id, "Delivered", "Package delivered successfully")}
                                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                                    >
                                        🎉 Mark Delivered
                                    </button>
                                )}
                                {selectedOrder.orderStatus !== "Cancelled" && (
                                    <button
                                        onClick={() => {
                                            const reason = prompt("Enter cancellation reason:");
                                            if (reason !== null) {
                                                handleUpdateStatus(selectedOrder.orderId || selectedOrder._id, "Cancelled", reason || "Cancelled by administrator");
                                            }
                                        }}
                                        className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                                    >
                                        ✕ Cancel / Reject Order
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Customer & Address Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Customer Profile */}
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">CUSTOMER INFORMATION</span>
                                <p className="font-bold text-gray-900 text-sm">{selectedOrder.customer?.name || selectedOrder.username || "Customer"}</p>
                                <p className="text-gray-600">Email: <span className="font-semibold text-gray-800">{selectedOrder.customer?.email || selectedOrder.email}</span></p>
                                <p className="text-gray-600">Phone: <span className="font-semibold text-gray-800">{selectedOrder.customer?.phone || selectedOrder.deliveryAddress?.mobile || "N/A"}</span></p>
                                <p className="text-gray-400 pt-1">Placed on: {formatDate(selectedOrder.createdAt)}</p>
                            </div>

                            {/* Delivery Address */}
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">SHIPPING DESTINATION</span>
                                {selectedOrder.deliveryAddress?.houseNo ? (
                                    <>
                                        <p className="font-bold text-gray-900 text-sm">{selectedOrder.deliveryAddress?.fullName || selectedOrder.customer?.name}</p>
                                        <p className="text-gray-600">
                                            {selectedOrder.deliveryAddress?.houseNo}, {selectedOrder.deliveryAddress?.street}
                                            {selectedOrder.deliveryAddress?.landmark ? `, Near ${selectedOrder.deliveryAddress.landmark}` : ""}
                                        </p>
                                        <p className="text-gray-600">
                                            {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - <strong>{selectedOrder.deliveryAddress?.pincode}</strong>
                                        </p>
                                        <p className="text-gray-600 pt-1">
                                            Recipient Phone: <strong>{selectedOrder.deliveryAddress?.mobile}</strong>
                                            {selectedOrder.deliveryAddress?.alternatePhone && ` | Alt: ${selectedOrder.deliveryAddress.alternatePhone}`}
                                        </p>
                                        {selectedOrder.deliveryAddress?.location?.latitude !== null && selectedOrder.deliveryAddress?.location?.latitude !== undefined && (
                                            <a
                                                href={selectedOrder.deliveryAddress.location.mapUrl || `https://www.google.com/maps?q=${selectedOrder.deliveryAddress.location.latitude},${selectedOrder.deliveryAddress.location.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1d5e4b] bg-[#eef5f2] px-2.5 py-1 rounded-lg border border-[#d2e4dc] hover:underline"
                                            >
                                                📍 Live GPS Pin ({selectedOrder.deliveryAddress.location.latitude}, {selectedOrder.deliveryAddress.location.longitude}) ↗
                                            </a>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500">Legacy order — no delivery address stored.</p>
                                )}
                            </div>
                        </div>

                        {/* Ordered Products Snapshot Table */}
                        <div className="mb-6">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">ORDERED ITEMS (SNAPSHOT)</span>
                            <div className="border rounded-2xl overflow-hidden divide-y divide-gray-100">
                                {(selectedOrder.items || []).map((item, idx) => (
                                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=80"}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded-xl border bg-white shrink-0"
                                            />
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">{item.name}</h5>
                                                <p className="text-gray-500">
                                                    Rate: <span className="font-semibold">₹{item.price}</span> × Qty: <span className="font-bold text-gray-800">{item.quantity}</span>
                                                </p>
                                                {item.productId && <p className="text-[10px] text-gray-400 font-mono">PID: {item.productId}</p>}
                                            </div>
                                        </div>
                                        <span className="font-extrabold text-gray-900 text-sm">
                                            ₹{item.subtotal || (item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Financials & Payment summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">PAYMENT INFORMATION</span>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Method:</span>
                                    <span className="font-bold text-gray-800">{selectedOrder.paymentMethod || "Cash on Delivery"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`font-bold ${selectedOrder.paymentStatus === "Completed" ? "text-green-600" : "text-amber-600"}`}>
                                        {selectedOrder.paymentStatus || "Pending"}
                                    </span>
                                </div>
                                {selectedOrder.deliveredAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Delivered At:</span>
                                        <span className="font-medium text-gray-700">{formatDate(selectedOrder.deliveredAt)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">TOTAL BREAKDOWN</span>
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>₹{selectedOrder.subtotal ?? selectedOrder.total ?? 0}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee:</span>
                                    <span>{selectedOrder.deliveryCharges > 0 ? `₹${selectedOrder.deliveryCharges}` : "FREE"}</span>
                                </div>
                                {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span>- ₹{selectedOrder.discount}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-gray-200 flex justify-between font-extrabold text-sm text-gray-900">
                                    <span>Final Payable:</span>
                                    <span className="text-blue-600 font-black">₹{selectedOrder.finalTotal || selectedOrder.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Audit Trail Log */}
                        {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                            <div className="mb-6">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">AUDIT TRAIL & STATUS HISTORY</span>
                                <div className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3 text-xs">
                                    {selectedOrder.statusHistory.map((hist, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-900">{hist.status}</span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(hist.timestamp)}</span>
                                                </div>
                                                {hist.comment && <p className="text-gray-600 mt-0.5">{hist.comment}</p>}
                                                <span className="text-[10px] text-gray-400">Recorded by: {hist.updatedBy}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Close button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl text-xs transition"
                            >
                                Close Details View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

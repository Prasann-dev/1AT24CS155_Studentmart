import { useState, useEffect, useCallback } from "react";

const TICKET_STATUSES = ["Open", "In Review", "Resolved"];
const TICKET_CATEGORIES = [
    "All",
    "Order Issue",
    "Delivery",
    "Payment & Refunds",
    "Product Inquiry",
    "Account & Technical",
    "Other"
];

function getStatusBadge(status) {
    switch (status) {
        case "Open":
            return "bg-rose-50 text-rose-700 border-rose-200";
        case "In Review":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Resolved":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200";
    }
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(dateString));
}

export default function AdminSupport({ token, onStatsChange }) {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({ total: 0, open: 0, inReview: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyStatus, setReplyStatus] = useState("In Review");
    const [adminReply, setAdminReply] = useState("");
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [loadError, setLoadError] = useState("");

    const PORT = 5002;
    const adminToken = token || localStorage.getItem("token");

    const getHeaders = useCallback(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
    }), [adminToken]);

    const showNotify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            let url = `http://localhost:${PORT}/api/support/admin/all?`;
            if (submittedSearch.trim()) url += `search=${encodeURIComponent(submittedSearch.trim())}&`;
            if (statusFilter !== "All") url += `status=${encodeURIComponent(statusFilter)}&`;
            if (categoryFilter !== "All") url += `category=${encodeURIComponent(categoryFilter)}&`;

            const res = await fetch(url, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
                if (data.stats) {
                    setStats(data.stats);
                    if (onStatsChange) onStatsChange(data.stats);
                }
            } else {
                setLoadError(`Failed to load support tickets (${res.status}). Restart the backend server if you recently updated it.`);
            }
        } catch (error) {
            console.error("Failed to fetch support tickets:", error);
            setLoadError("Could not connect to backend server on port 5002.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [submittedSearch, statusFilter, categoryFilter, getHeaders, onStatsChange]);

    useEffect(() => {
        let active = true;
        let url = `http://localhost:${PORT}/api/support/admin/all?`;
        if (submittedSearch.trim()) url += `search=${encodeURIComponent(submittedSearch.trim())}&`;
        if (statusFilter !== "All") url += `status=${encodeURIComponent(statusFilter)}&`;
        if (categoryFilter !== "All") url += `category=${encodeURIComponent(categoryFilter)}&`;

        fetch(url, { headers: getHeaders() })
            .then(async (res) => {
                if (!res.ok) {
                    if (active) {
                        setLoadError(`Failed to load support tickets (${res.status}). Restart the backend server if you recently updated it.`);
                    }
                    return null;
                }
                if (active) setLoadError("");
                return res.json();
            })
            .then((data) => {
                if (!active || !data) return;
                setTickets(data.tickets || []);
                if (data.stats) {
                    setStats(data.stats);
                    if (onStatsChange) onStatsChange(data.stats);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch support tickets:", error);
                if (active) setLoadError("Could not connect to backend server on port 5002.");
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                    setRefreshing(false);
                }
            });

        return () => { active = false; };
    }, [submittedSearch, statusFilter, categoryFilter, getHeaders, onStatsChange]);

    const openTicketModal = (ticket) => {
        setSelectedTicket(ticket);
        setReplyStatus(ticket.status || "Open");
        setAdminReply(ticket.adminReply || "");
    };

    const handleUpdateTicket = async (ticketId, targetStatus, replyText) => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:${PORT}/api/support/admin/${ticketId}/status`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({
                    status: targetStatus,
                    adminReply: replyText
                })
            });
            const data = await res.json();
            if (res.ok) {
                showNotify("success", `Ticket marked as "${targetStatus}".`);
                await fetchTickets();
                if (selectedTicket && selectedTicket._id === ticketId) {
                    setSelectedTicket(data.ticket);
                    setReplyStatus(data.ticket.status);
                    setAdminReply(data.ticket.adminReply || "");
                }
            } else {
                showNotify("error", data.message || "Failed to update ticket.");
            }
        } catch (error) {
            console.error("Update ticket error:", error);
            showNotify("error", "Server connection error.");
        } finally {
            setSaving(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (submittedSearch === search) {
            fetchTickets();
        } else {
            setSubmittedSearch(search);
        }
    };

    return (
        <div className="space-y-6">
            {loadError && (
                <div className="p-4 rounded-2xl text-sm bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                    {loadError}
                </div>
            )}

            {notification && (
                <div className={`p-4 rounded-2xl text-sm flex items-center justify-between shadow-sm border ${
                    notification.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                }`}>
                    <span className="font-semibold">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="text-xs font-bold ml-4">✕</button>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-[#e8dfd3] shadow-xs">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">TOTAL TICKETS</p>
                    <h3 className="text-2xl font-black text-[#131b26] my-1">{stats.total}</h3>
                    <p className="text-xs text-gray-500">All student inquiries</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-[#e8dfd3] shadow-xs">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">OPEN</p>
                    <h3 className="text-2xl font-black text-rose-600 my-1">{stats.open}</h3>
                    <p className="text-xs text-gray-500">Needs admin response</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-[#e8dfd3] shadow-xs">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">IN REVIEW</p>
                    <h3 className="text-2xl font-black text-amber-600 my-1">{stats.inReview}</h3>
                    <p className="text-xs text-gray-500">Being investigated</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-[#e8dfd3] shadow-xs">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">RESOLVED</p>
                    <h3 className="text-2xl font-black text-[#1d5e4b] my-1">{stats.resolved}</h3>
                    <p className="text-xs text-gray-500">Completed requests</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-3xl border border-[#e8dfd3] shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by subject, student name, email, or order ID..."
                        className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-[#e3d9cb] text-sm outline-none focus:border-[#1d5e4b] bg-[#f6f1ea]/50 transition"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1.5 bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                    >
                        Search
                    </button>
                </form>

                <div className="flex flex-wrap items-center gap-2.5">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-blue-500"
                    >
                        <option value="All">All Statuses</option>
                        {TICKET_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-blue-500"
                    >
                        {TICKET_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            setRefreshing(true);
                            fetchTickets();
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl text-xs font-bold transition"
                        title="Refresh tickets"
                    >
                        <svg className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">Student Support Tickets</h2>
                        <p className="text-xs text-gray-500">Showing {tickets.length} ticket(s)</p>
                    </div>
                    {(statusFilter !== "All" || categoryFilter !== "All" || submittedSearch) && (
                        <button
                            onClick={() => {
                                setStatusFilter("All");
                                setCategoryFilter("All");
                                setSearch("");
                                setSubmittedSearch("");
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="py-16 text-center text-gray-400 text-sm">Loading support tickets...</div>
                ) : tickets.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 text-sm">
                        No support tickets found matching your filters.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {tickets.map((ticket) => (
                            <div key={ticket._id} className="p-5 hover:bg-blue-50/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                                            {ticket.category}
                                        </span>
                                        {ticket.orderId && (
                                            <span className="text-[11px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                                                Order: {ticket.orderId}
                                            </span>
                                        )}
                                        <span className="text-[11px] text-gray-400">{formatDate(ticket.createdAt)}</span>
                                    </div>

                                    <h4 className="text-sm font-extrabold text-gray-900">{ticket.subject}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-2">{ticket.message}</p>
                                    <p className="text-[11px] text-gray-500">
                                        Raised by <strong className="text-gray-800">{ticket.userName}</strong> ({ticket.userEmail})
                                    </p>

                                    {ticket.adminReply && (
                                        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-900">
                                            <span className="font-bold">Admin Reply: </span>
                                            {ticket.adminReply}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <select
                                        value={ticket.status}
                                        disabled={saving}
                                        onChange={(e) => handleUpdateTicket(ticket._id, e.target.value, ticket.adminReply || "")}
                                        className={`text-xs font-extrabold px-3 py-2 rounded-xl border outline-none cursor-pointer ${getStatusBadge(ticket.status)}`}
                                    >
                                        {TICKET_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => openTicketModal(ticket)}
                                        className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
                                    >
                                        View & Reply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ticket Reply Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-5">
                        <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                                    SUPPORT TICKET DETAILS
                                </span>
                                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">{selectedTicket.subject}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                            <div className="flex flex-wrap justify-between gap-2 text-gray-500">
                                <span>From: <strong className="text-gray-900">{selectedTicket.userName}</strong> ({selectedTicket.userEmail})</span>
                                <span>{formatDate(selectedTicket.createdAt)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{selectedTicket.category}</span>
                                {selectedTicket.orderId && (
                                    <span className="font-mono font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border">
                                        Order: {selectedTicket.orderId}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-800 text-sm leading-relaxed pt-2 border-t border-gray-200/70">
                                {selectedTicket.message}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Ticket Status</label>
                                <select
                                    value={replyStatus}
                                    onChange={(e) => setReplyStatus(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-500"
                                >
                                    {TICKET_STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Response to Student</label>
                                <textarea
                                    rows="4"
                                    value={adminReply}
                                    onChange={(e) => setAdminReply(e.target.value)}
                                    placeholder="Write a helpful response or resolution note for the student..."
                                    className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedTicket(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={async () => {
                                    await handleUpdateTicket(selectedTicket._id, replyStatus, adminReply);
                                    setSelectedTicket(null);
                                }}
                                className="flex-1 bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save & Send Reply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

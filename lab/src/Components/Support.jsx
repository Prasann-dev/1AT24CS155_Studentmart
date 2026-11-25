import { useState, useEffect, useCallback } from "react";

const FAQS = [
    {
        q: "How do I use the STUDENT10 10% OFF promo code?",
        a: "Add items to your cart, click Proceed to Checkout, and enter STUDENT10 in the Promo Code box on the right-hand Price Details card. A 10% discount is applied immediately."
    },
    {
        q: "When do I qualify for free campus delivery?",
        a: "Orders with a subtotal of ₹500 or above automatically receive FREE delivery. Orders below ₹500 have a flat ₹40 delivery fee."
    },
    {
        q: "Can I cancel an order after placing it?",
        a: "Yes! Go to My Orders and click Cancel Order while the order status is still Placed or Confirmed. Reserved inventory is automatically restored."
    },
    {
        q: "How are Loyalty Points calculated?",
        a: "You earn 1 Loyalty Point for every ₹10 spent on valid (non-cancelled) StudentMart orders. Track your points from the Dashboard overview."
    }
];

export default function Support({ token, orders = [] }) {
    const [openFaq, setOpenFaq] = useState(0);
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const [form, setForm] = useState({
        subject: "",
        category: "Order Issue",
        orderId: "",
        message: ""
    });

    const PORT = 5002;
    const authToken = token || localStorage.getItem("token");

    const fetchTickets = useCallback(async () => {
        if (!authToken) return;
        try {
            const res = await fetch(`http://localhost:${PORT}/api/support/my-tickets`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Support tickets fetch error:", error);
        } finally {
            setLoadingTickets(false);
        }
    }, [authToken]);

    useEffect(() => {
        if (!authToken) return;
        let active = true;
        fetch(`http://localhost:${PORT}/api/support/my-tickets`, {
            headers: { Authorization: `Bearer ${authToken}` }
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && Array.isArray(data)) setTickets(data);
            })
            .catch((error) => console.error("Support tickets fetch error:", error))
            .finally(() => {
                if (active) setLoadingTickets(false);
            });
        return () => { active = false; };
    }, [authToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);
        setSubmitting(true);

        try {
            const res = await fetch(`http://localhost:${PORT}/api/support`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback({ type: "success", text: "Support ticket submitted! Our campus team will respond shortly." });
                setForm({ subject: "", category: "Order Issue", orderId: "", message: "" });
                fetchTickets();
            } else {
                setFeedback({ type: "error", text: data.message || "Failed to submit ticket." });
            }
        } catch {
            setFeedback({ type: "error", text: "Server connection failed." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-xs">
                <h1 className="text-2xl font-extrabold text-[#131b26]">Help & Support</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Browse quick answers or submit a support request to the StudentMart campus desk.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Submit Ticket Form */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Submit a Support Request</h2>

                    {feedback && (
                        <div className={`mb-4 p-3.5 rounded-xl text-xs font-semibold border ${
                            feedback.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                            {feedback.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="Order Issue">Order Issue</option>
                                    <option value="Delivery">Delivery</option>
                                    <option value="Payment & Refunds">Payment & Refunds</option>
                                    <option value="Product Inquiry">Product Inquiry</option>
                                    <option value="Account & Technical">Account & Technical</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Related Order (Optional)</label>
                                <select
                                    value={form.orderId}
                                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="">None / General Question</option>
                                    {orders.map((o) => {
                                        const code = o.orderId || o.invoiceNo || o._id;
                                        return (
                                            <option key={o._id || code} value={code}>
                                                {code} — ₹{o.finalTotal || o.total}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Subject *</label>
                            <input
                                type="text"
                                required
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                placeholder="Briefly describe your issue..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Message *</label>
                            <textarea
                                required
                                rows="4"
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                placeholder="Provide details so our campus support team can help faster..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-xs disabled:opacity-50"
                        >
                            {submitting ? "Submitting..." : "Submit Support Ticket"}
                        </button>
                    </form>
                </div>

                {/* Right: FAQs & Recent Tickets */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                        <div className="space-y-2.5">
                            {FAQS.map((faq, idx) => (
                                <div key={faq.q} className="border border-slate-200/80 rounded-xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                                    >
                                        <span>{faq.q}</span>
                                        <span className="text-blue-600 ml-2">{openFaq === idx ? "−" : "+"}</span>
                                    </button>
                                    {openFaq === idx && (
                                        <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 bg-slate-50/50">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Your Recent Tickets</h2>
                        {loadingTickets ? (
                            <p className="text-xs text-slate-400">Loading tickets...</p>
                        ) : tickets.length === 0 ? (
                            <p className="text-xs text-slate-500">No support tickets submitted yet.</p>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {tickets.map((t) => {
                                    const badgeStyle =
                                        t.status === "Resolved"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : t.status === "In Review"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200";
                                    return (
                                        <div key={t._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-xs text-slate-900 truncate">{t.subject}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeStyle}`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600">{t.message}</p>
                                            {t.adminReply && (
                                                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                                                    <span className="font-bold">Admin Reply: </span>
                                                    {t.adminReply}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

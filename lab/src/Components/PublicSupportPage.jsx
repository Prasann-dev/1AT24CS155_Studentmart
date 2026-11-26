import { useState } from "react";

const SUPPORT_FAQS = [
    {
        topic: "Orders",
        q: "Do I need an account to browse products?",
        a: "No. You can explore the homepage, filter categories, search products, and add items to your bag without signing in. Sign in is only required when you proceed to Checkout, view My Orders, or manage your Wishlist."
    },
    {
        topic: "Delivery",
        q: "How does Live Location delivery work?",
        a: "During Checkout Step 1 (Delivery Address), click Use Live Location to automatically attach your GPS pin and auto-fill street, city, state, and PIN details."
    },
    {
        topic: "Payments",
        q: "How do I apply the STUDENT10 discount?",
        a: "Enter STUDENT10 in the Promo Code box on the right-hand Price Details card during Checkout to get 10% OFF your subtotal. Orders of ₹500+ also receive free delivery."
    },
    {
        topic: "Invoices",
        q: "Where can I download my order invoice?",
        a: "Once signed in, open My Orders (or the Order Confirmation screen after checkout) and click Download Invoice to save an itemized PDF receipt."
    },
    {
        topic: "Cancellations",
        q: "Can I cancel an order after placing it?",
        a: "Yes. Orders in Placed or Confirmed status can be cancelled directly from My Orders, and reserved stock is restored automatically."
    }
];

export default function PublicSupportPage({ isAuthenticated, onRequireAuth, onNavigate }) {
    const [search, setSearch] = useState("");
    const [openIdx, setOpenIdx] = useState(0);

    const filteredFaqs = SUPPORT_FAQS.filter((item) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q) ||
            item.topic.toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 space-y-12">
            {/* Header & Search */}
            <section className="bg-[#131b26] text-white rounded-3xl p-8 sm:p-12 shadow-md">
                <div className="max-w-2xl space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#f1dec9]">
                        Help & Support Center
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        How can we help you today?
                    </h1>
                    <p className="text-sm text-slate-300">
                        Search answers on orders, live GPS delivery, promo codes, and PDF invoices — or sign in to raise a tracked support ticket.
                    </p>
                    <div className="relative pt-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search help topics (e.g. invoice, STUDENT10, live location)..."
                            className="w-full px-4 py-3 pl-10 rounded-xl bg-white text-[#131b26] text-sm font-medium outline-none"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Quick Self-Service Actions */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
                    <div>
                        <h3 className="text-base font-extrabold text-[#131b26]">Track Orders & Invoices</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            View shipment status, cancel eligible orders, and download PDF invoices.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRequireAuth("orders")}
                        className="self-start text-xs font-bold text-[#1d5e4b] hover:underline"
                    >
                        {isAuthenticated ? "Open My Orders →" : "Sign In to View Orders →"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
                    <div>
                        <h3 className="text-base font-extrabold text-[#131b26]">Raise a Support Ticket</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Link an order ID and receive direct replies from StudentMart administrators.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRequireAuth("support")}
                        className="self-start text-xs font-bold text-[#1d5e4b] hover:underline"
                    >
                        {isAuthenticated ? "Open Support Desk →" : "Sign In to Raise Ticket →"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
                    <div>
                        <h3 className="text-base font-extrabold text-[#131b26]">General & Guest Inquiries</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Send a message directly to our campus desk without needing an account.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigate("contact")}
                        className="self-start text-xs font-bold text-[#1d5e4b] hover:underline"
                    >
                        Go to Contact Us →
                    </button>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-xl font-extrabold text-[#131b26]">Frequently Asked Questions</h2>

                {filteredFaqs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6">No help articles matched "{search}".</p>
                ) : (
                    <div className="space-y-2.5">
                        {filteredFaqs.map((faq, idx) => (
                            <div key={faq.q} className="border border-slate-200/80 rounded-2xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#eef5f2] text-[#1d5e4b] px-2.5 py-0.5 rounded-full">
                                            {faq.topic}
                                        </span>
                                        <span className="text-sm font-bold text-[#131b26]">{faq.q}</span>
                                    </div>
                                    <span className="text-[#1d5e4b] font-bold text-lg ml-3">{openIdx === idx ? "−" : "+"}</span>
                                </button>
                                {openIdx === idx && (
                                    <div className="px-5 pb-4 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-[#faf9f7]">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

import { useState } from "react";

export default function ContactPage({ user }) {
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        subject: "",
        message: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);
        setSubmitting(true);

        try {
            const res = await fetch("http://localhost:5002/api/support/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback({
                    type: "success",
                    text: data.message || "Your message has been sent to our campus team."
                });
                setForm((prev) => ({ ...prev, subject: "", message: "" }));
            } else {
                setFeedback({
                    type: "error",
                    text: data.message || "Could not send message. Please check your details."
                });
            }
        } catch {
            setFeedback({
                type: "error",
                text: "Could not reach the server. Please ensure the backend is running."
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 space-y-10">
            <div className="max-w-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#1d5e4b]">
                    Contact Us
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#131b26] tracking-tight">
                    Get in touch with StudentMart
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                    Questions about campus delivery, bulk department orders, or product availability? Send us a message directly — no login required.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Campus Contact Cards */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-extrabold text-[#131b26]">Campus Retail & Support Desk</h2>

                        <div className="space-y-3 text-sm">
                            <div className="p-3.5 rounded-xl bg-[#f6f1ea]/70 border border-[#e8dfd3]">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Support</p>
                                <a href="mailto:support@studentmart.com" className="font-bold text-[#1d5e4b] hover:underline mt-0.5 block">
                                    support@studentmart.com
                                </a>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#f6f1ea]/70 border border-[#e8dfd3]">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Helpline</p>
                                <p className="font-bold text-[#131b26] mt-0.5">+91 98765 43210</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#f6f1ea]/70 border border-[#e8dfd3]">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Campus Location</p>
                                <p className="font-semibold text-[#131b26] mt-0.5">
                                    Student Activity Center, Block A, Ground Floor
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#f6f1ea]/70 border border-[#e8dfd3]">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Desk Hours</p>
                                <p className="font-semibold text-[#131b26] mt-0.5">Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Contact Form */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                    <h2 className="text-lg font-extrabold text-[#131b26] mb-1">Send Us a Message</h2>
                    <p className="text-xs text-slate-500 mb-6">
                        Inquiries are routed straight to our campus administrator desk.
                    </p>

                    {feedback && (
                        <div className={`mb-5 p-4 rounded-xl text-xs font-semibold border ${
                            feedback.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                            {feedback.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Yashwanth"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#1d5e4b]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="student@college.edu"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#1d5e4b]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                            <input
                                type="text"
                                required
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                placeholder="e.g. Bulk order inquiry / Campus delivery question"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#1d5e4b]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                            <textarea
                                rows="5"
                                required
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                placeholder="How can we help you?"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#1d5e4b] resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold px-7 py-3 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                        >
                            {submitting ? "Sending..." : "Send Message →"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

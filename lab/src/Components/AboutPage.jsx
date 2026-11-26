export default function AboutPage({ productCount = 15, onNavigate }) {
    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 space-y-14">
            {/* Editorial Header */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs">
                <div className="max-w-3xl space-y-4">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1d5e4b]">
                        About StudentMart
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-[#131b26] tracking-tight leading-tight">
                        Built for students, designed around campus life.
                    </h1>
                    <p className="text-base text-slate-600 leading-relaxed">
                        StudentMart brings together everyday college essentials — from wireless audio and scientific calculators to course textbooks, drafting kits, and campus apparel — in one clean, reliable store with transparent student pricing.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-200/80">
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[#131b26]">{productCount}+</p>
                        <p className="text-xs text-slate-500 mt-1">Verified Catalog Items</p>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[#1d5e4b]">10% OFF</p>
                        <p className="text-xs text-slate-500 mt-1">With Code STUDENT10</p>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[#131b26]">₹500+</p>
                        <p className="text-xs text-slate-500 mt-1">Free Campus Delivery</p>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[#131b26]">Live GPS</p>
                        <p className="text-xs text-slate-500 mt-1">Accurate Drop-Off Pins</p>
                    </div>
                </div>
            </section>

            {/* How StudentMart Works */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#131b26] tracking-tight">How StudentMart Works</h2>
                    <p className="text-sm text-slate-500 mt-1">Simple from discovery to doorstep delivery.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        {
                            step: "01",
                            title: "Browse Freely Without Login",
                            desc: "Compare electronics, books, stationery, and clothing across the entire catalog and add items to your shopping bag anytime."
                        },
                        {
                            step: "02",
                            title: "Pin Your Live Delivery Location",
                            desc: "Sign in at checkout, attach your exact hostel or campus block GPS coordinates in one click, and apply STUDENT10 for 10% savings."
                        },
                        {
                            step: "03",
                            title: "Track Orders & Download Invoices",
                            desc: "Follow real-time fulfillment milestones in My Orders and download itemized PDF invoices whenever you need them."
                        }
                    ].map((card) => (
                        <div key={card.step} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                            <span className="inline-block text-xs font-mono font-extrabold text-[#1d5e4b] bg-[#eef5f2] px-2.5 py-1 rounded-lg">
                                STEP {card.step}
                            </span>
                            <h3 className="text-lg font-bold text-[#131b26]">{card.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Strip */}
            <section className="bg-[#f6f1ea] rounded-3xl border border-[#e5dacb] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#131b26]">Ready to explore the catalog?</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Browse products freely or reach out to our campus desk with any questions.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => onNavigate("store")}
                        className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold px-6 py-3 rounded-full text-xs transition"
                    >
                        Shop Store →
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigate("contact")}
                        className="bg-white hover:bg-slate-50 text-[#131b26] border border-[#d8cbb9] font-bold px-6 py-3 rounded-full text-xs transition"
                    >
                        Contact Us
                    </button>
                </div>
            </section>
        </div>
    );
}

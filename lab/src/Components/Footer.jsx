export default function Footer({ onNavigate, onSelectCategory, onRequireAuth, isAuthenticated }) {
    const categories = ["Electronics", "Books", "Stationery", "Accessories", "Clothing"];

    return (
        <footer className="bg-[#131b26] text-slate-300 border-t border-white/10 mt-16">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-4">
                        <button
                            type="button"
                            onClick={() => onNavigate("home")}
                            className="flex items-center gap-2.5 text-left"
                        >
                            <div className="w-9 h-9 rounded-xl bg-[#1d5e4b] flex items-center justify-center text-[#f1dec9]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                            </div>
                            <span className="text-lg font-extrabold text-white tracking-tight">StudentMart</span>
                        </button>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                            Your campus, connected. Curated electronics, academic books, stationery, and everyday campus gear with transparent student pricing and doorstep delivery.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                            <span className="text-[#f1dec9] font-bold">STUDENT10</span>
                            <span className="text-slate-400">· 10% student discount at checkout</span>
                        </div>
                    </div>

                    {/* Shop Column */}
                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Shop</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li>
                                <button type="button" onClick={() => onSelectCategory("All")} className="hover:text-white transition">
                                    All Products
                                </button>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat}>
                                    <button type="button" onClick={() => onSelectCategory(cat)} className="hover:text-white transition">
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Care Column */}
                    <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Account & Orders</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li>
                                <button type="button" onClick={() => onRequireAuth("orders")} className="hover:text-white transition">
                                    My Orders & Invoices
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRequireAuth("checkout")} className="hover:text-white transition">
                                    Checkout & Live Location
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRequireAuth("wishlist")} className="hover:text-white transition">
                                    Saved Wishlist
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRequireAuth(isAuthenticated ? "dashboard" : "login")} className="hover:text-white transition">
                                    {isAuthenticated ? "Student Dashboard" : "Student / Admin Sign In"}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Company & Support Column */}
                    <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Company & Support</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li>
                                <button type="button" onClick={() => onNavigate("about")} className="hover:text-white transition">
                                    About Us
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onNavigate("contact")} className="hover:text-white transition">
                                    Contact Us
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onNavigate("support")} className="hover:text-white transition">
                                    Help & Support
                                </button>
                            </li>
                        </ul>
                        <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                            <p>Student Activity Center, Block A</p>
                            <p>support@studentmart.com · +91 98765 43210</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                    <p>© 2026 StudentMart. All rights reserved.</p>
                    <p className="text-[11px]">
                        Free Delivery ₹500+ · Cash on Delivery · Instant PDF Invoices
                    </p>
                </div>
            </div>
        </footer>
    );
}

import { useState, useEffect, useRef } from "react";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import AdminDashboard from "./Components/AdminDashboard";
import StorefrontHome from "./Components/StorefrontHome";
import PublicCatalog from "./Components/PublicCatalog";
import AboutPage from "./Components/AboutPage";
import ContactPage from "./Components/ContactPage";
import PublicSupportPage from "./Components/PublicSupportPage";
import CartDrawer from "./Components/CartDrawer";
import Footer from "./Components/Footer";

const PORT = 5002;

function App() {
    // 1. Safely load user & token from localStorage on startup
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            if (!savedUser) return null;
            const parsed = JSON.parse(savedUser);
            return (parsed && (parsed.id || parsed._id || parsed.email)) ? parsed : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || "";
    });

    // Persistent cart shared between public Storefront and Student Dashboard
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem("studentmart_cart");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Navigation mode:
    // "storefront" (default guest-accessible experience) | "dashboard" (authenticated portal)
    const [viewMode, setViewMode] = useState(() => {
        if (user && user.role === "admin") return "dashboard";
        return "storefront";
    });
    const [publicPage, setPublicPage] = useState("home"); // "home" | "store" | "about" | "contact" | "support"
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(true);
    const [authPrompt, setAuthPrompt] = useState("");
    const [pendingDashboardTab, setPendingDashboardTab] = useState("home");
    const [dashboardTab, setDashboardTab] = useState("home");

    // Storefront catalog state
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [storeSearch, setStoreSearch] = useState("");
    const [storeCategory, setStoreCategory] = useState("All");
    const [selectedProductModal, setSelectedProductModal] = useState(null);
    const [modalQty, setModalQty] = useState(1);
    const [cartOpen, setCartOpen] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [toast, setToast] = useState("");
    const [wishlistIds, setWishlistIds] = useState([]);

    const topSearchRef = useRef(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2800);
    };

    // Sync cart to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("studentmart_cart", JSON.stringify(cart));
        } catch {
            // ignore quota errors
        }
    }, [cart]);

    // Fetch public product catalog (no login required)
    useEffect(() => {
        let active = true;
        fetch(`http://localhost:${PORT}/api/products`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (active && Array.isArray(data)) setProducts(data);
            })
            .catch((err) => console.error("Public products fetch error:", err))
            .finally(() => {
                if (active) setProductsLoading(false);
            });
        return () => { active = false; };
    }, []);

    // Fetch wishlist IDs when authenticated student is browsing storefront
    useEffect(() => {
        if (!token || !user || user.role === "admin") return;
        let active = true;
        fetch(`http://localhost:${PORT}/api/wishlist`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (active && Array.isArray(data)) {
                    setWishlistIds(data.map((w) => w._id));
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, [token, user]);

    // Ctrl + K focus top storefront search
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && viewMode === "storefront") {
                e.preventDefault();
                topSearchRef.current?.focus();
            } else if (e.key === "Escape") {
                setSelectedProductModal(null);
                setCartOpen(false);
                setShowUserDropdown(false);
                setAuthModalOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [viewMode]);

    // Helper to sync React state AND localStorage seamlessly
    const handleSetUser = (userData, userToken = null) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            if (userToken) {
                setToken(userToken);
                localStorage.setItem("token", userToken);
            }
            if (userData.role === "admin") {
                setAuthModalOpen(false);
                setViewMode("dashboard");
            } else {
                const targetTab = pendingDashboardTab || "home";
                setDashboardTab(targetTab);
                setPendingDashboardTab("home");
                setAuthPrompt("");
                setAuthModalOpen(false);
                setViewMode("dashboard");
            }
        } else {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setToken("");
            setWishlistIds([]);
            setViewMode("storefront");
            setPublicPage("home");
        }
    };

    const handleLogout = () => {
        handleSetUser(null);
    };

    // Auth gate helper for Checkout, My Orders, Wishlist, Profile, Dashboard
    const handleRequireAuth = (targetTab = "home", reasonText = "") => {
        setCartOpen(false);
        setSelectedProductModal(null);
        setShowUserDropdown(false);

        if (user) {
            if (user.role === "admin") {
                setViewMode("dashboard");
            } else {
                setDashboardTab(targetTab === "login" ? "home" : targetTab);
                setViewMode("dashboard");
            }
            return;
        }

        const resolvedTab = targetTab === "login" ? "home" : targetTab;
        setPendingDashboardTab(resolvedTab);
        if (reasonText) {
            setAuthPrompt(reasonText);
        } else if (resolvedTab === "checkout") {
            setAuthPrompt("Sign in to complete your checkout and pin your delivery address.");
        } else if (resolvedTab === "orders") {
            setAuthPrompt("Sign in to view your orders and download PDF invoices.");
        } else if (resolvedTab === "wishlist") {
            setAuthPrompt("Sign in to save items to your personal Wishlist.");
        } else if (resolvedTab === "support") {
            setAuthPrompt("Sign in to submit and track support tickets.");
        } else {
            setAuthPrompt("");
        }
        setShowLogin(true);
        setAuthModalOpen(true);
    };

    // Cart operations (work for both guests and signed-in users)
    const addToCart = (product, qty = 1) => {
        if (!product?._id) return;
        setCart((prev) => {
            const existing = prev.find((i) => i._id === product._id);
            if (existing) {
                return prev.map((i) =>
                    i._id === product._id ? { ...i, quantity: (i.quantity || 1) + qty } : i
                );
            }
            return [...prev, { ...product, quantity: qty }];
        });
        showToast(`Added "${product.name}" to your shopping bag`);
    };

    const updateCartQuantity = (productId, delta) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item._id === productId) {
                        const nextQty = (item.quantity || 1) + delta;
                        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((item) => item._id !== productId));
    };

    const handleBuyNow = (product, qty = 1) => {
        addToCart(product, qty);
        handleRequireAuth("checkout", "Sign in to continue to Checkout with your selected item.");
    };

    const handleToggleWishlist = async (product) => {
        if (!user || !token) {
            handleRequireAuth("wishlist", "Sign in to save items to your Wishlist.");
            return;
        }
        if (user.role === "admin") return;
        try {
            const res = await fetch(`http://localhost:${PORT}/api/wishlist/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product._id })
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data.wishlist)) {
                setWishlistIds(data.wishlist.map((w) => w._id));
                showToast(data.added ? `Saved "${product.name}" to Wishlist` : `Removed from Wishlist`);
            }
        } catch (err) {
            console.error("Wishlist toggle error:", err);
        }
    };

    const navigatePublic = (page) => {
        setPublicPage(page);
        setViewMode("storefront");
        setShowUserDropdown(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSelectCategory = (cat) => {
        setStoreCategory(cat);
        setPublicPage("store");
        setViewMode("storefront");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Authenticated Admin or Student Dashboard
    if (user && viewMode === "dashboard") {
        return user.role === "admin" ? (
            <AdminDashboard user={user} token={token} onLogout={handleLogout} />
        ) : (
            <Dashboard
                user={user}
                token={token}
                onLogout={handleLogout}
                setUser={handleSetUser}
                initialTab={dashboardTab}
                sharedCart={cart}
                setSharedCart={setCart}
                onOpenStorefront={() => navigatePublic("home")}
            />
        );
    }

    // Default: Public Apple Store + Reliance Digital Inspired E-Commerce Storefront (No login required)
    const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f7f5] text-[#131b26] font-sans">
            {/* Top Utility Promo Strip */}
            <div className="bg-[#131b26] text-[#f1dec9] text-[11px] font-medium py-2 px-4 text-center">
                Free campus delivery on orders ₹500+ · Extra 10% student discount with code{" "}
                <span className="font-mono font-bold text-white">STUDENT10</span>
            </div>

            {/* Sticky Translucent Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <button
                        type="button"
                        onClick={() => navigatePublic("home")}
                        className="flex items-center gap-2.5 text-left shrink-0"
                    >
                        <div className="w-8 h-8 rounded-xl bg-[#1d5e4b] flex items-center justify-center text-[#f1dec9]">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-[#131b26]">StudentMart</span>
                    </button>

                    {/* Primary Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { id: "home", label: "Home" },
                            { id: "store", label: "Store" },
                            { id: "about", label: "About Us" },
                            { id: "contact", label: "Contact Us" },
                            { id: "support", label: "Help & Support" }
                        ].map((link) => (
                            <button
                                key={link.id}
                                type="button"
                                onClick={() => navigatePublic(link.id)}
                                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition ${
                                    publicPage === link.id
                                        ? "bg-[#131b26] text-white"
                                        : "text-slate-600 hover:text-[#131b26] hover:bg-slate-100"
                                }`}
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* Right Utility Cluster */}
                    <div className="flex items-center gap-2.5">
                        {/* Search Input */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                setPublicPage("store");
                            }}
                            className="hidden lg:flex items-center relative"
                        >
                            <input
                                ref={topSearchRef}
                                type="text"
                                value={storeSearch}
                                onChange={(e) => {
                                    setStoreSearch(e.target.value);
                                    if (publicPage !== "store") setPublicPage("store");
                                }}
                                placeholder="Search store..."
                                className="w-48 pl-8 pr-12 py-1.5 rounded-full bg-[#f4f4f2] border border-slate-200/80 text-xs outline-none focus:bg-white focus:border-[#1d5e4b] focus:w-56 transition-all"
                            />
                            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <span className="absolute right-2.5 text-[9px] font-semibold text-slate-400 pointer-events-none">
                                Ctrl K
                            </span>
                        </form>

                        {/* My Orders (Auth-gated) */}
                        <button
                            type="button"
                            onClick={() => handleRequireAuth("orders")}
                            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                            My Orders
                        </button>

                        {/* Shopping Bag Drawer Trigger */}
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f4f4f2] hover:bg-slate-200/70 border border-slate-200/80 text-xs font-bold text-[#131b26] transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            <span className="hidden sm:inline">Bag</span>
                            {cartCount > 0 && (
                                <span className="bg-[#1d5e4b] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Login / Account Button */}
                        {user ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowUserDropdown((prev) => !prev)}
                                    className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#131b26] text-white text-xs font-semibold transition"
                                >
                                    <span className="w-6 h-6 rounded-full bg-[#1d5e4b] flex items-center justify-center text-[11px] font-bold">
                                        {(user.name || "S").charAt(0).toUpperCase()}
                                    </span>
                                    <span className="max-w-[90px] truncate hidden sm:inline">
                                        {user.name?.split(" ")[0] || "Account"}
                                    </span>
                                </button>
                                {showUserDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
                                        <button
                                            onClick={() => handleRequireAuth("home")}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-[#131b26]"
                                        >
                                            Dashboard
                                        </button>
                                        <button
                                            onClick={() => handleRequireAuth("orders")}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                                        >
                                            My Orders
                                        </button>
                                        <button
                                            onClick={() => handleRequireAuth("wishlist")}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                                        >
                                            Wishlist
                                        </button>
                                        <div className="border-t border-slate-100 my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 hover:bg-rose-50 font-semibold text-rose-600"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleRequireAuth("home", "")}
                                className="px-4 py-2 rounded-full bg-[#1d5e4b] hover:bg-[#174c3c] text-white text-xs font-bold transition shadow-xs"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Sub-Nav */}
                <div className="md:hidden border-t border-slate-200/60 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
                    {[
                        { id: "home", label: "Home" },
                        { id: "store", label: "Store" },
                        { id: "about", label: "About Us" },
                        { id: "contact", label: "Contact Us" },
                        { id: "support", label: "Help & Support" }
                    ].map((link) => (
                        <button
                            key={link.id}
                            type="button"
                            onClick={() => navigatePublic(link.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                publicPage === link.id
                                    ? "bg-[#131b26] text-white"
                                    : "text-slate-600 bg-slate-100"
                            }`}
                        >
                            {link.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 bg-[#131b26] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl">
                    {toast}
                </div>
            )}

            {/* Page Content */}
            <main className="flex-1">
                {publicPage === "home" && (
                    <StorefrontHome
                        products={products}
                        loading={productsLoading}
                        onExploreStore={() => navigatePublic("store")}
                        onSelectCategory={handleSelectCategory}
                        onAddToCart={(p) => addToCart(p, 1)}
                        onViewProduct={(p) => {
                            setModalQty(1);
                            setSelectedProductModal(p);
                        }}
                        onBuyNow={(p) => handleBuyNow(p, 1)}
                        onToggleWishlist={handleToggleWishlist}
                        wishlistIds={wishlistIds}
                        onCopyPromo={() => showToast("Code STUDENT10 copied for checkout")}
                    />
                )}

                {publicPage === "store" && (
                    <PublicCatalog
                        products={products}
                        loading={productsLoading}
                        searchQuery={storeSearch}
                        onSearchChange={setStoreSearch}
                        selectedCategory={storeCategory}
                        onCategoryChange={setStoreCategory}
                        onAddToCart={(p) => addToCart(p, 1)}
                        onBuyNow={(p) => handleBuyNow(p, 1)}
                        onViewProduct={(p) => {
                            setModalQty(1);
                            setSelectedProductModal(p);
                        }}
                        onToggleWishlist={handleToggleWishlist}
                        wishlistIds={wishlistIds}
                    />
                )}

                {publicPage === "about" && (
                    <AboutPage
                        productCount={products.length || 15}
                        onNavigate={navigatePublic}
                    />
                )}

                {publicPage === "contact" && <ContactPage user={user} />}

                {publicPage === "support" && (
                    <PublicSupportPage
                        isAuthenticated={Boolean(user)}
                        onRequireAuth={handleRequireAuth}
                        onNavigate={navigatePublic}
                    />
                )}
            </main>

            {/* Professional Multi-Column Footer */}
            <Footer
                onNavigate={navigatePublic}
                onSelectCategory={handleSelectCategory}
                onRequireAuth={handleRequireAuth}
                isAuthenticated={Boolean(user)}
            />

            {/* Slide-Over Shopping Bag Drawer */}
            <CartDrawer
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                cart={cart}
                onUpdateQuantity={updateCartQuantity}
                onRemove={removeFromCart}
                onCheckout={() => handleRequireAuth("checkout")}
            />

            {/* Product Quick-View / Specification Modal */}
            {selectedProductModal && (
                <div
                    onClick={() => setSelectedProductModal(null)}
                    className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2"
                    >
                        <div className="bg-slate-100">
                            <img
                                src={selectedProductModal.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"}
                                alt={selectedProductModal.name}
                                className="w-full h-72 md:h-full object-cover"
                            />
                        </div>

                        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#1d5e4b] bg-[#eef5f2] px-2.5 py-1 rounded-full">
                                        {selectedProductModal.category}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProductModal(null)}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <h2 className="text-2xl font-extrabold text-[#131b26] mt-4">
                                    {selectedProductModal.name}
                                </h2>
                                <p className="text-2xl font-black text-[#131b26] mt-2">
                                    ₹{Number(selectedProductModal.price).toLocaleString("en-IN")}
                                </p>
                                <p className="text-xs font-semibold text-emerald-700 mt-1">
                                    {typeof selectedProductModal.stock === "number" && selectedProductModal.stock <= 0
                                        ? "Currently out of stock"
                                        : `In Stock (${selectedProductModal.stock ?? 10} available)`}
                                </p>

                                <p className="text-sm text-slate-600 leading-relaxed mt-4">
                                    {selectedProductModal.description || "Verified StudentMart campus essential ready for delivery."}
                                </p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600">Quantity</span>
                                    <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50">
                                        <button
                                            type="button"
                                            onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                                            className="w-8 h-8 font-bold text-slate-700"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center text-xs font-bold">{modalQty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setModalQty((q) => q + 1)}
                                            className="w-8 h-8 font-bold text-slate-700"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        disabled={typeof selectedProductModal.stock === "number" && selectedProductModal.stock <= 0}
                                        onClick={() => {
                                            addToCart(selectedProductModal, modalQty);
                                            setSelectedProductModal(null);
                                            setCartOpen(true);
                                        }}
                                        className="py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#131b26] font-bold text-xs transition disabled:opacity-50"
                                    >
                                        Add to Bag
                                    </button>
                                    <button
                                        type="button"
                                        disabled={typeof selectedProductModal.stock === "number" && selectedProductModal.stock <= 0}
                                        onClick={() => handleBuyNow(selectedProductModal, modalQty)}
                                        className="py-3 rounded-xl bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold text-xs transition disabled:opacity-50"
                                    >
                                        Buy Now →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* In-Place Transparent Frosted-Glass Login / Register Modal Overlay */}
            {authModalOpen && !user && (
                <div
                    onClick={() => setAuthModalOpen(false)}
                    className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[3px] flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[405px] my-auto"
                    >
                        <button
                            type="button"
                            onClick={() => setAuthModalOpen(false)}
                            aria-label="Close sign in dialog"
                            className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white border border-white/35 shadow-lg font-bold text-sm flex items-center justify-center transition"
                        >
                            ✕
                        </button>

                        {authPrompt && (
                            <div className="mb-3 px-4 py-2.5 rounded-2xl bg-[#131b26]/55 border border-white/25 text-[#f1dec9] text-xs font-semibold text-center backdrop-blur-xl shadow-lg">
                                {authPrompt}
                            </div>
                        )}

                        {showLogin ? (
                            <Login setLoggedInUser={handleSetUser} onSwitch={() => setShowLogin(false)} />
                        ) : (
                            <Register onSwitch={() => setShowLogin(true)} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

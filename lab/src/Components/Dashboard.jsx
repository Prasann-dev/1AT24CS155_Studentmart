import { useState, useEffect, useRef, useCallback } from "react";
import Profile from "./Profile";
import Products from "./Products";
import Checkout from "./Checkout";
import OrderConfirmation from "./OrderConfirmation";
import MyOrders from "./MyOrders";
import Wishlist from "./Wishlist";
import Support from "./Support";
import Settings from "./Settings";
import { downloadOrderInvoice } from "../utils/invoiceGenerator";

const HERO_SLIDES = [
    {
        title: "Smart Shopping\nfor Smart Students",
        subtitle: "Discover the best deals on StudentMart.",
        cta: "Explore Store",
        actionTab: "products",
        promo: ""
    },
    {
        title: "Extra 10% OFF\nWith STUDENT10",
        subtitle: "Save on textbooks, tech accessories, and campus gear.",
        cta: "Apply & Shop",
        actionTab: "products",
        promo: "STUDENT10"
    },
    {
        title: "Free Campus Delivery\nAbove ₹500",
        subtitle: "Fast delivery right to your hostel or campus block.",
        cta: "Browse Catalog",
        actionTab: "products",
        promo: ""
    }
];

const ANNOUNCEMENTS = [
    {
        id: "free-shipping",
        title: "Free Shipping on orders above ₹500",
        subtitle: "Shop more, save more!",
        tone: "blue",
        promoCode: ""
    },
    {
        id: "student10",
        title: "Special Offer: 10% OFF",
        subtitle: "Use code: STUDENT10",
        tone: "rose",
        promoCode: "STUDENT10"
    }
];

const NavItem = ({ tabId, label, svgPath, badge, activeTab, onSelect }) => {
    const isActive =
        activeTab === tabId ||
        (tabId === "cart" && activeTab === "checkout") ||
        (tabId === "orders" && activeTab === "order-confirmation");

    return (
        <button
            type="button"
            onClick={() => onSelect(tabId)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                isActive
                    ? "bg-[#1b4d3e] text-white shadow-md shadow-black/25"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
        >
            <div className="flex items-center gap-3">
                <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {svgPath}
                </svg>
                <span className="font-medium text-[13.5px]">{label}</span>
            </div>

            {badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
                    {badge}
                </span>
            )}
        </button>
    );
};

function getOrderStatusStyle(status) {
    switch (status) {
        case "Delivered":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Shipped":
            return "bg-sky-50 text-sky-700 border-sky-200";
        case "Out for Delivery":
            return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "Confirmed":
        case "Processing":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Placed":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "Cancelled":
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
    }
}

function formatShortDate(dateValue) {
    if (!dateValue) return "Recent";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return String(dateValue);
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(parsed);
}

function formatRelativeTime(dateValue) {
    if (!dateValue) return "Recently";
    const time = new Date(dateValue).getTime();
    if (Number.isNaN(time)) return "Recently";
    const diffMs = Date.now() - time;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
}

function Dashboard({
    user,
    token,
    onLogout,
    setUser,
    initialTab = "home",
    sharedCart,
    setSharedCart,
    onOpenStorefront
}) {
    const [activeTab, setActiveTab] = useState(initialTab || "home");
    const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
    const [localCart, setLocalCart] = useState([]);
    const cart = sharedCart !== undefined ? sharedCart : localCart;
    const setCart = setSharedCart || setLocalCart;
    const [latestOrder, setLatestOrder] = useState(null);

    if (initialTab !== prevInitialTab) {
        setPrevInitialTab(initialTab);
        if (initialTab) setActiveTab(initialTab);
    }

    // Live data synced from backend
    const [orders, setOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [allProducts, setAllProducts] = useState([]);

    // Top bar search (Ctrl + K)
    const [globalSearch, setGlobalSearch] = useState("");
    const [storeSearchQuery, setStoreSearchQuery] = useState("");
    const [focusedProduct, setFocusedProduct] = useState(null);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Popovers & Modals
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCleared, setUnreadCleared] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Hero Carousel
    const [heroSlide, setHeroSlide] = useState(0);

    // Promo code & Preferences
    const [preferences, setPreferences] = useState(() => {
        try {
            const saved = localStorage.getItem("studentmart_prefs");
            if (saved) return JSON.parse(saved);
        } catch {
            // fallback to defaults
        }
        return { orderAlerts: true, promoAlerts: true, autoApplyPromo: false };
    });
    const [activePromoCode, setActivePromoCode] = useState(() =>
        preferences.autoApplyPromo ? "STUDENT10" : ""
    );

    // Local activity log (merged with real orders)
    const [localActivities, setLocalActivities] = useState(() => {
        try {
            const saved = localStorage.getItem("studentmart_activity");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const PORT = 5002;
    const authToken = token || localStorage.getItem("token") || "";

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 3000);
    }, []);

    const logActivity = useCallback((text) => {
        setLocalActivities((prev) => {
            const next = [{ id: `${Date.now()}-${Math.random()}`, text, timestamp: new Date().toISOString() }, ...prev].slice(0, 12);
            try {
                localStorage.setItem("studentmart_activity", JSON.stringify(next));
            } catch {
                // ignore storage quota errors
            }
            return next;
        });
    }, []);

    const handleUpdatePreferences = (nextPrefs) => {
        setPreferences(nextPrefs);
        try {
            localStorage.setItem("studentmart_prefs", JSON.stringify(nextPrefs));
        } catch {
            // ignore
        }
        if (nextPrefs.autoApplyPromo && !activePromoCode) {
            setActivePromoCode("STUDENT10");
        }
        logActivity("Updated account preferences");
    };

    const refreshOrders = useCallback(async () => {
        if (!authToken) return;
        try {
            const res = await fetch(`http://localhost:${PORT}/api/orders/my-orders`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Dashboard orders fetch error:", error);
        }
    }, [authToken]);

    // Fetch initial orders, wishlist, and products
    useEffect(() => {
        let active = true;
        if (authToken) {
            fetch(`http://localhost:${PORT}/api/orders/my-orders`, {
                headers: { Authorization: `Bearer ${authToken}` }
            })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (active && Array.isArray(data)) setOrders(data);
                })
                .catch((error) => console.error("Orders load error:", error));

            fetch(`http://localhost:${PORT}/api/wishlist`, {
                headers: { Authorization: `Bearer ${authToken}` }
            })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (active && Array.isArray(data)) setWishlist(data);
                })
                .catch((error) => console.error("Wishlist load error:", error))
                .finally(() => {
                    if (active) setWishlistLoading(false);
                });
        }

        fetch(`http://localhost:${PORT}/api/products`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && Array.isArray(data)) setAllProducts(data);
            })
            .catch((error) => console.error("Products load error:", error));

        return () => { active = false; };
    }, [authToken]);

    // Keyboard shortcut Ctrl + K / Cmd + K
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
                setShowSearchDropdown(true);
            } else if (e.key === "Escape") {
                setShowSearchDropdown(false);
                setShowNotifications(false);
                setShowUserMenu(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // Close search dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-rotate hero banner every 6s when on dashboard home
    useEffect(() => {
        if (activeTab !== "home") return undefined;
        const timer = setInterval(() => {
            setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [activeTab]);

    const handleNavSelect = (tabId) => {
        setShowNotifications(false);
        setShowUserMenu(false);
        if (tabId === "logout") {
            onLogout();
            return;
        }
        if (tabId === "home" || tabId === "orders") {
            refreshOrders();
        }
        if (tabId === "products") {
            setFocusedProduct(null);
        }
        setActiveTab(tabId);
    };

    const handleToggleWishlist = async (product) => {
        if (!authToken || !product?._id) return;
        try {
            const res = await fetch(`http://localhost:${PORT}/api/wishlist/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({ productId: product._id })
            });
            const data = await res.json();
            if (res.ok) {
                setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
                if (data.added) {
                    logActivity(`Added ${product.name} to Wishlist`);
                    showToast(`Saved "${product.name}" to Wishlist`);
                } else {
                    showToast(`Removed "${product.name}" from Wishlist`);
                }
            }
        } catch (error) {
            console.error("Wishlist toggle error:", error);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        if (!authToken) return;
        try {
            const res = await fetch(`http://localhost:${PORT}/api/wishlist/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
                showToast("Removed item from Wishlist");
            }
        } catch (error) {
            console.error("Wishlist remove error:", error);
        }
    };

    const handleAddToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i._id === product._id);
            if (existing) {
                return prev.map((i) => (i._id === product._id ? { ...i, quantity: (i.quantity || 1) + 1 } : i));
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        showToast(`Added "${product.name}" to Cart`);
    };

    const handleApplyPromoAndShop = (code = "STUDENT10") => {
        setActivePromoCode(code);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).catch(() => {});
        }
        showToast(`Code ${code} ready! It will apply at Checkout.`);
        setActiveTab("products");
    };

    const handleProfileUpdate = (updatedUser, userToken) => {
        setUser(updatedUser, userToken);
        logActivity("Profile Updated");
    };

    // Derived user display strings
    const safeName = user?.name || "Student";
    const firstName = safeName.split(" ")[0] || "Student";
    const safeUsn = user?.usn || safeName;
    const safeInitial = safeName.charAt(0).toUpperCase();

    // Derived dashboard metrics
    const totalOrdersCount = orders.length;
    const now = new Date();
    const ordersThisMonth = orders.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const validOrders = orders.filter((o) => o.orderStatus !== "Cancelled");
    const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.finalTotal ?? o.total ?? 0), 0);
    const loyaltyPoints = Math.floor(totalSpent / 10);
    const wishlistIds = wishlist.map((w) => w._id);
    const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Search results for top search bar
    const searchMatches = globalSearch.trim()
        ? allProducts.filter((p) =>
            (p.name || "").toLowerCase().includes(globalSearch.trim().toLowerCase()) ||
            (p.category || "").toLowerCase().includes(globalSearch.trim().toLowerCase())
        ).slice(0, 5)
        : [];

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setStoreSearchQuery(globalSearch);
        setFocusedProduct(null);
        setShowSearchDropdown(false);
        setActiveTab("products");
    };

    // Combined Recent Activity feed
    const orderActivities = orders.slice(0, 6).map((o) => ({
        id: `order-${o._id || o.orderId}`,
        text: `Order #${o.orderId || o.invoiceNo || String(o._id).slice(-6)} ${o.orderStatus === "Cancelled" ? "cancelled" : "placed"}`,
        timestamp: o.createdAt || new Date().toISOString()
    }));

    const combinedActivities = [...localActivities, ...orderActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    const notificationsList = [
        ...orders.slice(0, 4).map((o) => ({
            id: `notif-${o._id}`,
            title: `Order #${o.orderId || o.invoiceNo || String(o._id).slice(-6)}`,
            detail: `Status: ${o.orderStatus || "Placed"} · ₹${o.finalTotal ?? o.total ?? 0}`,
            time: formatRelativeTime(o.updatedAt || o.createdAt),
            targetTab: "orders"
        })),
        {
            id: "notif-promo",
            title: "10% Student Discount",
            detail: "Use code STUDENT10 at checkout",
            time: "Active offer",
            targetTab: "products"
        }
    ];

    const todayFormatted = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(now);

    const activeSlide = HERO_SLIDES[heroSlide];

    return (
        <div className="flex h-screen bg-[#f6f1ea] text-[#131b26] overflow-hidden font-sans">
            {/* --- DARK CHARCOAL-NAVY SIDEBAR --- */}
            <aside className="w-64 bg-[#131b26] text-white flex flex-col shrink-0 z-30 select-none">
                {/* Brand Logo */}
                <div className="px-6 pt-6 pb-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-white">StudentMart</span>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-3.5 py-2 flex flex-col justify-between overflow-y-auto">
                    <div>
                        <div className="space-y-1">
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="home"
                                label="Dashboard"
                                svgPath={<><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="profile"
                                label="Profile"
                                svgPath={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="products"
                                label="Store"
                                svgPath={<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M3 12h18"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="cart"
                                label="My Cart"
                                badge={cartCount}
                                svgPath={<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="orders"
                                label="My Orders"
                                svgPath={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="wishlist"
                                label="Wishlist"
                                svgPath={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />}
                            />
                        </div>

                        <div className="border-t border-white/10 my-4" />

                        <div className="space-y-1">
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="support"
                                label="Help & Support"
                                svgPath={<><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="settings"
                                label="Settings"
                                svgPath={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}
                            />
                            <NavItem
                                activeTab={activeTab}
                                onSelect={handleNavSelect}
                                tabId="logout"
                                label="Logout"
                                svgPath={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}
                            />
                        </div>
                    </div>

                    {/* Promo Card + Footer */}
                    <div className="pt-4 space-y-3">
                        <div className="bg-[#1c2635] border border-white/10 rounded-2xl p-3.5 relative overflow-hidden">
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#f1dec9]/15 text-[#f1dec9] flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                        <line x1="7" y1="7" x2="7.01" y2="7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-white leading-tight">Get 10% OFF</p>
                                    <p className="text-[11px] text-slate-300 mt-0.5">on your next order!</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleApplyPromoAndShop("STUDENT10")}
                                className="mt-3 w-full bg-[#f1dec9] hover:bg-white text-[#131b26] font-bold text-xs py-1.5 px-3 rounded-full transition flex items-center justify-center gap-1"
                            >
                                <span>Shop Now</span>
                                <span>→</span>
                            </button>
                        </div>

                        <div className="text-center text-[10px] text-slate-400 leading-relaxed pb-1">
                            <p>© 2026 StudentMart</p>
                            <p>All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- RIGHT SIDE: HEADER + MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* TOP HEADER BAR */}
                <header className="bg-[#fbf8f3]/95 backdrop-blur border-b border-[#e8dfd3] px-6 lg:px-8 py-3 flex items-center justify-between gap-4 z-20 shrink-0">
                    {/* Global Search Bar */}
                    <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
                        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={globalSearch}
                                onFocus={() => setShowSearchDropdown(true)}
                                onChange={(e) => {
                                    setGlobalSearch(e.target.value);
                                    setShowSearchDropdown(true);
                                }}
                                placeholder="Search for products..."
                                className="w-full bg-[#f6f1ea] border border-[#e3d9cb] rounded-xl pl-10 pr-16 py-2 text-sm text-[#131b26] placeholder-slate-400 outline-none focus:bg-white focus:border-[#1d5e4b] transition"
                            />
                            <span className="absolute right-2.5 text-[10px] font-semibold text-slate-400 bg-white border border-[#e3d9cb] px-1.5 py-0.5 rounded-md pointer-events-none">
                                Ctrl + K
                            </span>
                        </form>

                        {showSearchDropdown && globalSearch.trim() && (
                            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-40">
                                {searchMatches.length === 0 ? (
                                    <div className="p-4 text-xs text-slate-500 text-center">
                                        No products matching "{globalSearch}"
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {searchMatches.map((p) => (
                                            <button
                                                key={p._id}
                                                type="button"
                                                onClick={() => {
                                                    setFocusedProduct(p);
                                                    setShowSearchDropdown(false);
                                                    setActiveTab("products");
                                                }}
                                                className="w-full p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-left transition"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img
                                                        src={p.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=80"}
                                                        alt={p.name}
                                                        className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                                                        <p className="text-[11px] text-slate-500">{p.category}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-extrabold text-[#1d5e4b] shrink-0">₹{p.price}</span>
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleSearchSubmit}
                                            className="w-full py-2.5 text-center text-xs font-bold text-[#1d5e4b] bg-[#eef5f2] hover:bg-[#e2efe9] transition"
                                        >
                                            View all results in Store →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Controls: Storefront link + Bell + User Pill */}
                    <div className="flex items-center gap-3">
                        {onOpenStorefront && (
                            <button
                                type="button"
                                onClick={onOpenStorefront}
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f6f1ea] hover:bg-[#ebe2d5] border border-[#e3d9cb] text-xs font-bold text-[#131b26] transition"
                            >
                                <span>← Storefront</span>
                            </button>
                        )}
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNotifications((prev) => !prev);
                                    setShowUserMenu(false);
                                }}
                                className="w-9 h-9 rounded-full bg-[#f8fafc] hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 relative transition"
                                title="Notifications"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                {!unreadCleared && preferences.orderAlerts && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-2 ring-2 ring-white" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-40 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-slate-900">Notifications</span>
                                        <button
                                            type="button"
                                            onClick={() => setUnreadCleared(true)}
                                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                                        {notificationsList.map((n) => (
                                            <button
                                                key={n.id}
                                                type="button"
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    setUnreadCleared(true);
                                                    setActiveTab(n.targetTab);
                                                }}
                                                className="w-full p-3.5 text-left hover:bg-slate-50 transition"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                                                    <span className="text-[10px] text-slate-400">{n.time}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{n.detail}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Pill */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUserMenu((prev) => !prev);
                                    setShowNotifications(false);
                                }}
                                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition"
                            >
                                {user?.imageUrl ? (
                                    <img
                                        src={user.imageUrl}
                                        alt={safeName}
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-[#1d5e4b] text-white flex items-center justify-center font-bold text-xs">
                                        {safeInitial}
                                    </div>
                                )}
                                <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">{safeUsn}</span>
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-40 text-xs">
                                    <div className="px-3.5 py-2 border-b border-slate-100">
                                        <p className="font-bold text-slate-900 truncate">{safeName}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <button onClick={() => handleNavSelect("profile")} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-medium text-slate-700">My Profile</button>
                                    <button onClick={() => handleNavSelect("orders")} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-medium text-slate-700">My Orders</button>
                                    <button onClick={() => handleNavSelect("wishlist")} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-medium text-slate-700">Wishlist</button>
                                    <button onClick={() => handleNavSelect("settings")} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-medium text-slate-700">Settings</button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button onClick={() => handleNavSelect("logout")} className="w-full text-left px-3.5 py-2 hover:bg-rose-50 font-semibold text-rose-600">Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl">
                        {toastMessage}
                    </div>
                )}

                {/* MAIN SCROLLABLE CONTENT */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-7">
                    <div className="max-w-[1200px] mx-auto">
                        {activeTab === "profile" && (
                            <Profile
                                key={user?._id || user?.id || user?.email || "profile"}
                                user={user}
                                onLogout={onLogout}
                                setUser={handleProfileUpdate}
                            />
                        )}

                        <div className={["products", "cart"].includes(activeTab) ? "block" : "hidden"}>
                            <Products
                                user={user}
                                currentTab={activeTab}
                                setActiveTab={setActiveTab}
                                cart={cart}
                                setCart={setCart}
                                wishlistIds={wishlistIds}
                                onToggleWishlist={handleToggleWishlist}
                                externalSearch={storeSearchQuery}
                                focusedProduct={focusedProduct}
                                onClearFocusedProduct={() => setFocusedProduct(null)}
                            />
                        </div>

                        {activeTab === "checkout" && (
                            <Checkout
                                user={user}
                                token={token}
                                cart={cart}
                                setCart={setCart}
                                setActiveTab={setActiveTab}
                                initialPromoCode={activePromoCode}
                                onOrderPlaced={(order) => {
                                    setLatestOrder(order);
                                    refreshOrders();
                                    logActivity(`Order #${order?.orderId || order?.invoiceNo || "New"} placed`);
                                    setActiveTab("order-confirmation");
                                }}
                            />
                        )}

                        {activeTab === "order-confirmation" && (
                            <OrderConfirmation
                                order={latestOrder}
                                setActiveTab={setActiveTab}
                            />
                        )}

                        {activeTab === "orders" && (
                            <MyOrders
                                token={token}
                                setActiveTab={setActiveTab}
                            />
                        )}

                        {activeTab === "wishlist" && (
                            <Wishlist
                                wishlist={wishlist}
                                loading={wishlistLoading}
                                onRemove={handleRemoveFromWishlist}
                                onAddToCart={handleAddToCart}
                                setActiveTab={setActiveTab}
                            />
                        )}

                        {activeTab === "support" && (
                            <Support
                                token={token}
                                orders={orders}
                            />
                        )}

                        {activeTab === "settings" && (
                            <Settings
                                user={user}
                                preferences={preferences}
                                onUpdatePreferences={handleUpdatePreferences}
                                setActiveTab={setActiveTab}
                                onActivityLog={logActivity}
                            />
                        )}

                        {/* --- DASHBOARD OVERVIEW HOME --- */}
                        {activeTab === "home" && (
                            <div className="space-y-5">
                                {/* Greeting Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                            <span>Welcome back, {firstName}!</span>
                                            <span aria-hidden="true">👋</span>
                                        </h1>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                            Manage your orders, explore products and make your student life better.
                                        </p>
                                    </div>

                                    <div className="inline-flex items-center gap-2 bg-white border border-[#e3d9cb] px-3.5 py-2 rounded-xl shadow-xs text-xs font-semibold text-slate-700 self-start sm:self-auto">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span>{todayFormatted}</span>
                                    </div>
                                </div>

                                {/* 4 Stat Cards Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Total Orders */}
                                    <div
                                        onClick={() => handleNavSelect("orders")}
                                        className="cursor-pointer rounded-2xl p-4 bg-gradient-to-br from-[#fdf4ea] via-[#faf2e8] to-white border border-[#eddcc8] shadow-xs hover:shadow-md transition relative overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3.5 relative z-10">
                                            <div className="w-11 h-11 rounded-2xl bg-[#f4e4d1] text-[#a05f2c] flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                                    <line x1="3" y1="6" x2="21" y2="6" />
                                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-extrabold text-[#131b26] leading-none">{totalOrdersCount}</p>
                                                <p className="text-xs font-semibold text-slate-600 mt-1.5">Total Orders</p>
                                                <p className="text-[11px] font-bold text-[#1d5e4b] mt-2">
                                                    ↑ +{ordersThisMonth} this month
                                                </p>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-[#f4e4d1]/50 pointer-events-none" />
                                    </div>

                                    {/* Card 2: Total Spent */}
                                    <div
                                        onClick={() => handleNavSelect("orders")}
                                        className="cursor-pointer rounded-2xl p-4 bg-gradient-to-br from-[#fdf4ea] via-[#faf2e8] to-white border border-[#eddcc8] shadow-xs hover:shadow-md transition relative overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3.5 relative z-10">
                                            <div className="w-11 h-11 rounded-2xl bg-[#f4e4d1] text-[#a05f2c] flex items-center justify-center shrink-0 font-extrabold text-lg">
                                                ₹
                                            </div>
                                            <div>
                                                <p className="text-2xl font-extrabold text-[#131b26] leading-none">
                                                    ₹{totalSpent.toLocaleString("en-IN")}
                                                </p>
                                                <p className="text-xs font-semibold text-slate-600 mt-1.5">Total Spent</p>
                                                <p className="text-[11px] font-bold text-[#a05f2c] mt-2">
                                                    ↑ {validOrders.length} valid order{validOrders.length === 1 ? "" : "s"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-[#f4e4d1]/50 pointer-events-none" />
                                    </div>

                                    {/* Card 3: Wishlist Items */}
                                    <div
                                        onClick={() => handleNavSelect("wishlist")}
                                        className="cursor-pointer rounded-2xl p-4 bg-gradient-to-br from-[#fdf4ea] via-[#faf2e8] to-white border border-[#eddcc8] shadow-xs hover:shadow-md transition relative overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3.5 relative z-10">
                                            <div className="w-11 h-11 rounded-2xl bg-[#f4e4d1] text-[#a05f2c] flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-extrabold text-[#131b26] leading-none">{wishlist.length}</p>
                                                <p className="text-xs font-semibold text-slate-600 mt-1.5">Wishlist Items</p>
                                                <p className="text-[11px] font-semibold text-[#a05f2c] mt-2">
                                                    View saved items →
                                                </p>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-[#f4e4d1]/50 pointer-events-none" />
                                    </div>

                                    {/* Card 4: Loyalty Points */}
                                    <div className="rounded-2xl p-4 bg-gradient-to-br from-[#fdf4ea] via-[#faf2e8] to-white border border-[#eddcc8] shadow-xs hover:shadow-md transition relative overflow-hidden">
                                        <div className="flex items-start gap-3.5 relative z-10">
                                            <div className="w-11 h-11 rounded-2xl bg-[#f4e4d1] text-[#a05f2c] flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-extrabold text-[#131b26] leading-none">{loyaltyPoints} pts</p>
                                                <p className="text-xs font-semibold text-slate-600 mt-1.5">Loyalty Points</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRewardsModal(true)}
                                                    className="text-[11px] font-bold text-[#a05f2c] hover:underline mt-2 inline-block"
                                                >
                                                    View Rewards →
                                                </button>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-[#f4e4d1]/50 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Middle Row: Hero Banner + Recent Orders */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* Dark Navy Hero Carousel Banner */}
                                    <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#131b26] via-[#192434] to-[#243347] p-6 sm:p-7 border border-[#253244] shadow-md relative overflow-hidden flex flex-col justify-between min-h-[230px]">
                                        <div className="relative z-10 max-w-xs sm:max-w-sm">
                                            <h2 className="text-2xl sm:text-[28px] font-extrabold text-white leading-tight whitespace-pre-line">
                                                {activeSlide.title}
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-300 mt-2.5">
                                                {activeSlide.subtitle}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (activeSlide.promo) {
                                                        handleApplyPromoAndShop(activeSlide.promo);
                                                    } else {
                                                        handleNavSelect(activeSlide.actionTab);
                                                    }
                                                }}
                                                className="mt-5 inline-flex items-center gap-2 bg-[#f1dec9] hover:bg-white text-[#131b26] text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition"
                                            >
                                                <span>{activeSlide.cta}</span>
                                                <span>→</span>
                                            </button>
                                        </div>

                                        {/* Decorative Campus Desk Illustration */}
                                        <div className="hidden sm:block absolute right-4 bottom-2 w-56 h-44 pointer-events-none select-none">
                                            <svg viewBox="0 0 260 200" className="w-full h-full drop-shadow-md">
                                                <rect x="10" y="162" width="240" height="16" rx="8" fill="#334155" opacity="0.65" />
                                                <path d="M52 158 L170 158 L184 166 L38 166 Z" fill="#94a3b8" />
                                                <rect x="64" y="84" width="96" height="72" rx="6" fill="#0b111a" stroke="#475569" strokeWidth="1.5" />
                                                <rect x="69" y="89" width="86" height="62" rx="3" fill="#1d5e4b" opacity="0.35" />
                                                <rect x="76" y="98" width="50" height="6" rx="3" fill="#f1dec9" opacity="0.85" />
                                                <rect x="76" y="110" width="72" height="4" rx="2" fill="#94a3b8" opacity="0.7" />
                                                <rect x="76" y="120" width="60" height="4" rx="2" fill="#94a3b8" opacity="0.5" />
                                                <rect x="182" y="142" width="60" height="16" rx="3" fill="#2d6a4f" />
                                                <rect x="186" y="128" width="54" height="14" rx="3" fill="#e9b872" />
                                                <rect x="184" y="116" width="58" height="12" rx="3" fill="#4f6d7a" />
                                                <rect x="196" y="84" width="28" height="32" rx="5" fill="#f1dec9" />
                                                <path d="M210 84 C205 62, 192 56, 198 46 C206 54, 210 68, 210 84 Z" fill="#1d5e4b" />
                                                <path d="M210 84 C216 60, 228 54, 224 44 C216 52, 211 66, 210 84 Z" fill="#2b7a62" />
                                                <path d="M210 84 C210 58, 210 44, 210 38 C215 48, 214 66, 210 84 Z" fill="#164a3b" />
                                            </svg>
                                        </div>

                                        {/* Pagination Dots */}
                                        <div className="relative z-10 flex items-center justify-center gap-1.5 mt-4">
                                            {HERO_SLIDES.map((s, idx) => (
                                                <button
                                                    key={s.title}
                                                    type="button"
                                                    aria-label={`Slide ${idx + 1}`}
                                                    onClick={() => setHeroSlide(idx)}
                                                    className={`h-2 rounded-full transition-all ${
                                                        heroSlide === idx ? "w-5 bg-[#f1dec9]" : "w-2 bg-white/40 hover:bg-white/75"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Orders Card */}
                                    <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#e8dfd3] shadow-xs flex flex-col">
                                        <div className="flex items-center justify-between pb-3 border-b border-[#f0e9df]">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-[#131b26]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                </svg>
                                                <h3 className="text-sm font-extrabold text-[#131b26]">Recent Orders</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleNavSelect("orders")}
                                                className="text-xs font-bold text-[#1d5e4b] hover:underline"
                                            >
                                                View All →
                                            </button>
                                        </div>

                                        <div className="flex-1 divide-y divide-slate-100 mt-1">
                                            {orders.length === 0 ? (
                                                <div className="py-8 text-center">
                                                    <p className="text-xs text-slate-500">No orders placed yet.</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNavSelect("products")}
                                                        className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                                                    >
                                                        Browse Store →
                                                    </button>
                                                </div>
                                            ) : (
                                                orders.slice(0, 3).map((order) => {
                                                    const firstItem = order.items?.[0];
                                                    const title = firstItem?.name || order.orderId || order.invoiceNo || "Campus Order";
                                                    const extraCount = (order.items?.length || 0) - 1;
                                                    const status = order.orderStatus || "Placed";
                                                    return (
                                                        <div
                                                            key={order._id || order.orderId}
                                                            className="w-full py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-1.5 rounded-xl transition"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleNavSelect("orders")}
                                                                className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                                            >
                                                                <img
                                                                    src={firstItem?.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=80"}
                                                                    alt={title}
                                                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shrink-0 bg-slate-50"
                                                                />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                                        {title}{extraCount > 0 ? ` +${extraCount} more` : ""}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                                        {formatShortDate(order.createdAt || order.date)}
                                                                    </p>
                                                                </div>
                                                            </button>

                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getOrderStatusStyle(status)}`}>
                                                                    {status}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        downloadOrderInvoice(order);
                                                                        showToast("Invoice PDF downloaded");
                                                                    }}
                                                                    title="Download Invoice (PDF)"
                                                                    className="w-7 h-7 rounded-lg bg-[#eef5f2] hover:bg-[#dfeee6] text-[#1d5e4b] border border-[#d2e4dc] flex items-center justify-center transition"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                        <polyline points="7 10 12 15 17 10" />
                                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Quick Links + Recent Activity + Announcements */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                    {/* Quick Links */}
                                    <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-[#e8dfd3] shadow-xs">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-amber-500 text-sm">⚡</span>
                                            <h3 className="text-sm font-extrabold text-[#131b26]">Quick Links</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => handleNavSelect("products")}
                                                className="p-3.5 rounded-2xl bg-[#eef4f8] hover:bg-[#e1ecf3] border border-[#dce6ee] flex flex-col items-center justify-center text-center gap-2 transition"
                                            >
                                                <svg className="w-5 h-5 text-[#2d5a7b]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                                </svg>
                                                <span className="text-xs font-bold text-[#2d5a7b] leading-tight">Continue<br />Shopping →</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleNavSelect("orders")}
                                                className="p-3.5 rounded-2xl bg-[#edf5f1] hover:bg-[#dfeee6] border border-[#d6e7de] flex flex-col items-center justify-center text-center gap-2 transition"
                                            >
                                                <svg className="w-5 h-5 text-[#1d5e4b]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                                    <line x1="3" y1="6" x2="21" y2="6" />
                                                </svg>
                                                <span className="text-xs font-bold text-[#1d5e4b] leading-tight">My Orders →</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleNavSelect("wishlist")}
                                                className="p-3.5 rounded-2xl bg-[#fdf3ef] hover:bg-[#fae6de] border border-[#f5ddd3] flex flex-col items-center justify-center text-center gap-2 transition"
                                            >
                                                <svg className="w-5 h-5 text-[#b5483a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                </svg>
                                                <span className="text-xs font-bold text-[#b5483a] leading-tight">Wishlist →</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleNavSelect("profile")}
                                                className="p-3.5 rounded-2xl bg-[#f4f1f8] hover:bg-[#e8e2f0] border border-[#e3dce9] flex flex-col items-center justify-center text-center gap-2 transition"
                                            >
                                                <svg className="w-5 h-5 text-[#5b4d7c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                <span className="text-xs font-bold text-[#5b4d7c] leading-tight">My Profile →</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-[#e8dfd3] shadow-xs flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-[#131b26]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <h3 className="text-sm font-extrabold text-[#131b26]">Recent Activity</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowActivityModal(true)}
                                                className="text-xs font-bold text-[#1d5e4b] hover:underline"
                                            >
                                                View All →
                                            </button>
                                        </div>

                                        {combinedActivities.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-6">
                                                Your recent store activity will appear here.
                                            </div>
                                        ) : (
                                            <div className="space-y-3.5 relative pl-4 border-l-2 border-[#d5e5de] ml-1.5">
                                                {combinedActivities.slice(0, 3).map((act) => (
                                                    <div key={act.id} className="relative">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[#1d5e4b] ring-4 ring-white absolute -left-[22px] top-1" />
                                                        <p className="text-xs font-bold text-[#131b26] line-clamp-1">{act.text}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{formatRelativeTime(act.timestamp)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Announcements */}
                                    <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-[#e8dfd3] shadow-xs flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-[#131b26]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="m3 11 18-5v12L3 14v-3z" />
                                                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                                                </svg>
                                                <h3 className="text-sm font-extrabold text-[#131b26]">Announcements</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAnnouncementsModal(true)}
                                                className="text-xs font-bold text-[#1d5e4b] hover:underline"
                                            >
                                                View All →
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {ANNOUNCEMENTS.map((ann) => (
                                                <button
                                                    key={ann.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (ann.promoCode) {
                                                            handleApplyPromoAndShop(ann.promoCode);
                                                        } else {
                                                            handleNavSelect("products");
                                                        }
                                                    }}
                                                    className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                                                        ann.tone === "blue"
                                                            ? "bg-[#eff5ff] hover:bg-blue-100/70 border-blue-100"
                                                            : "bg-[#fff1f2] hover:bg-rose-100/70 border-rose-100"
                                                    }`}
                                                >
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                        ann.tone === "blue"
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-rose-500 text-white"
                                                    }`}>
                                                        {ann.tone === "blue" ? (
                                                            <span className="text-sm font-extrabold">i</span>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <polyline points="20 12 20 22 4 22 4 12" />
                                                                <rect x="2" y="7" width="20" height="5" />
                                                                <line x1="12" y1="22" x2="12" y2="7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-extrabold text-slate-900">{ann.title}</p>
                                                        <p className="text-[11px] text-slate-600 mt-0.5">{ann.subtitle}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL: LOYALTY REWARDS */}
            {showRewardsModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-slate-900">StudentMart Rewards</h3>
                            <button onClick={() => setShowRewardsModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm">✕</button>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-center">
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Current Balance</p>
                            <p className="text-3xl font-black text-slate-900 mt-1">{loyaltyPoints} pts</p>
                            <p className="text-xs text-slate-600 mt-1">Earn 1 point for every ₹10 spent on StudentMart.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-extrabold text-slate-900">10% OFF Student Coupon</p>
                                <p className="text-[11px] text-slate-600">Code: <span className="font-mono font-bold">STUDENT10</span></p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRewardsModal(false);
                                    handleApplyPromoAndShop("STUDENT10");
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
                            >
                                Apply & Shop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: FULL ACTIVITY LOG */}
            {showActivityModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-slate-900">Recent Activity</h3>
                            <button onClick={() => setShowActivityModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm">✕</button>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {combinedActivities.length === 0 ? (
                                <p className="text-xs text-slate-500">No activity recorded yet.</p>
                            ) : (
                                combinedActivities.map((act) => (
                                    <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                                        <span className="text-xs font-bold text-slate-800">{act.text}</span>
                                        <span className="text-[11px] text-slate-400 shrink-0">{formatRelativeTime(act.timestamp)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ALL ANNOUNCEMENTS */}
            {showAnnouncementsModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-slate-900">Campus Announcements</h3>
                            <button onClick={() => setShowAnnouncementsModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm">✕</button>
                        </div>
                        <div className="space-y-3">
                            {ANNOUNCEMENTS.map((ann) => (
                                <div key={ann.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                    <p className="text-sm font-extrabold text-slate-900">{ann.title}</p>
                                    <p className="text-xs text-slate-600">{ann.subtitle}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAnnouncementsModal(false);
                                            if (ann.promoCode) handleApplyPromoAndShop(ann.promoCode);
                                            else handleNavSelect("products");
                                        }}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        {ann.promoCode ? `Use ${ann.promoCode} in Store →` : "Shop Now →"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;

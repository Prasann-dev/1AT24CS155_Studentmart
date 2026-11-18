import { useState, useEffect } from "react";

export default function AdminDashboard({ user, token, onLogout }) {
    const [activeTab, setActiveTab] = useState("overview"); // "overview" | "products" | "add-product"
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        availableProducts: 0,
        outOfStock: 0,
        totalCategories: 0,
        totalInventoryValue: 0,
        averagePrice: 0
    });
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

    // Search and filter state for product management
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [sortOption, setSortOption] = useState("newest");

    // Add Product Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Stationery",
        stock: 10,
        imageUrl: ""
    });

    // Edit Modal state
    const [editingProduct, setEditingProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: 10,
        imageUrl: ""
    });

    // Delete Confirmation state
    const [deletingProduct, setDeletingProduct] = useState(null);

    const categories = ["Stationery", "Books", "Clothing", "Accessories", "Electronics", "General"];
    const PORT = 5002;

    const showNotify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const getAuthHeaders = () => {
        const storedToken = token || localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${storedToken}`
        };
    };

    useEffect(() => {
        fetchStats();
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [search, categoryFilter, sortOption]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`http://localhost:${PORT}/api/products/stats`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let url = `http://localhost:${PORT}/api/products?`;
            if (search) url += `search=${encodeURIComponent(search)}&`;
            if (categoryFilter && categoryFilter !== "All") url += `category=${encodeURIComponent(categoryFilter)}&`;
            if (sortOption) url += `sort=${encodeURIComponent(sortOption)}&`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:${PORT}/api/products`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                showNotify("success", `Product "${formData.name}" created successfully!`);
                setFormData({
                    name: "",
                    description: "",
                    price: "",
                    category: "Stationery",
                    stock: 10,
                    imageUrl: ""
                });
                fetchProducts();
                fetchStats();
                setActiveTab("products");
            } else {
                showNotify("error", data.message || "Failed to add product.");
            }
        } catch (error) {
            showNotify("error", "Server connection error while adding product.");
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setEditFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price || 0,
            category: product.category || "General",
            stock: product.stock !== undefined ? product.stock : 10,
            imageUrl: product.imageUrl || ""
        });
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const res = await fetch(`http://localhost:${PORT}/api/products/${editingProduct._id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(editFormData)
            });
            const data = await res.json();

            if (res.ok) {
                showNotify("success", `Product "${editFormData.name}" updated successfully!`);
                setEditingProduct(null);
                fetchProducts();
                fetchStats();
            } else {
                showNotify("error", data.message || "Failed to update product.");
            }
        } catch (error) {
            showNotify("error", "Server error while updating product.");
        }
    };

    const handleDeleteProduct = async () => {
        if (!deletingProduct) return;

        try {
            const res = await fetch(`http://localhost:${PORT}/api/products/${deletingProduct._id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            const data = await res.json();

            if (res.ok) {
                showNotify("success", `Product "${deletingProduct.name}" removed from store.`);
                setDeletingProduct(null);
                fetchProducts();
                fetchStats();
            } else {
                showNotify("error", data.message || "Failed to delete product.");
            }
        } catch (error) {
            showNotify("error", "Server error while deleting product.");
        }
    };

    const adminName = user?.name || "System Administrator";
    const adminEmail = user?.email || "admin@studentmart.com";

    // Calculated stats
    const totalProductsCount = stats.totalProducts || products.length;
    const availableProductsCount = stats.availableProducts !== undefined ? stats.availableProducts : products.filter(p => (p.stock || 10) > 0).length;
    const outOfStockCount = stats.outOfStock !== undefined ? stats.outOfStock : products.filter(p => p.stock === 0).length;
    const totalCategoriesCount = stats.totalCategories || new Set(products.map(p => p.category)).size;

    return (
        <div className="flex h-screen bg-[#f8fafc] text-gray-900 overflow-hidden font-sans">
            {/* SIDEBAR NAVIGATION */}
            <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col flex-shrink-0 z-20">
                {/* Brand Header */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">StudentMart</h2>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                            ADMIN PORTAL
                        </span>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center my-3">
                        MANAGEMENT
                    </div>

                    {/* Dashboard Overview */}
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                            activeTab === "overview"
                                ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
                        </svg>
                        <span>Dashboard Overview</span>
                    </button>

                    {/* Products Catalog */}
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                            activeTab === "products"
                                ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                            </svg>
                            <span>Products Catalog</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                            {products.length}
                        </span>
                    </button>

                    {/* Add New Product */}
                    <button
                        onClick={() => setActiveTab("add-product")}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                            activeTab === "add-product"
                                ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
                        </svg>
                        <span>Add New Product</span>
                    </button>
                </nav>

                {/* Admin Profile Box & Logout */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-100/80 border border-gray-200/50 mb-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{adminName}</p>
                            <p className="text-[11px] text-gray-500 truncate">{adminEmail}</p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100/90 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200/60 rounded-xl text-xs font-semibold transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        <span>Logout of Admin</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto bg-[#f8fafc] relative">
                {/* Top Notification Toast */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all ${
                        notification.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                    }`}>
                        <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
                        <span>{notification.message}</span>
                    </div>
                )}

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                {activeTab === "overview" && "Dashboard Overview"}
                                {activeTab === "products" && "Product Management"}
                                {activeTab === "add-product" && "Add New Store Product"}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Secure store inventory and product catalog management
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab("add-product")}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                                <span>Add Product</span>
                            </button>
                        </div>
                    </div>

                    {/* VIEW 1: OVERVIEW */}
                    {activeTab === "overview" && (
                        <div className="space-y-8">
                            {/* 4 Stat Metric Cards in a row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {/* Card 1: TOTAL PRODUCTS */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL PRODUCTS</p>
                                            <h3 className="text-3xl font-extrabold text-gray-900 my-2">
                                                {totalProductsCount}
                                            </h3>
                                        </div>
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Total catalog items</p>
                                </div>

                                {/* Card 2: AVAILABLE PRODUCTS */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">AVAILABLE PRODUCTS</p>
                                            <h3 className="text-3xl font-extrabold text-emerald-600 my-2">
                                                {availableProductsCount}
                                            </h3>
                                        </div>
                                        <div className="w-11 h-11 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Ready for student purchase</p>
                                </div>

                                {/* Card 3: OUT OF STOCK */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">OUT OF STOCK</p>
                                            <h3 className="text-3xl font-extrabold text-amber-500 my-2">
                                                {outOfStockCount}
                                            </h3>
                                        </div>
                                        <div className="w-11 h-11 rounded-2xl bg-amber-50/80 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Needs restocking</p>
                                </div>

                                {/* Card 4: CATEGORIES */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">CATEGORIES</p>
                                            <h3 className="text-3xl font-extrabold text-gray-900 my-2">
                                                {totalCategoriesCount}
                                            </h3>
                                        </div>
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <rect width="8" height="8" x="3" y="3" rx="2"/><rect width="8" height="8" x="3" y="13" rx="2"/><path d="m14 7 3-3 3 3"/><path d="m14 17 3 3 3-3"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Active product categories</p>
                                </div>
                            </div>

                            {/* Recent Products Section Container */}
                            <div className="bg-white/70 border border-gray-200/70 rounded-3xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Recent Products</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Quick snapshot of store catalog items</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab("products")}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                    >
                                        View Full Catalog →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {products.slice(0, 6).map((product) => (
                                        <div key={product._id} className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                                            <img
                                                src={product.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"}
                                                alt={product.name}
                                                className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0"
                                                onError={(e) => {
                                                    e.target.src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-end">
                                                    <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        {product.category || "General"}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm truncate mt-0.5">{product.name}</h4>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="font-extrabold text-emerald-600 text-sm">₹{product.price}</span>
                                                    <span className="text-xs text-gray-500 font-medium">Stock: {product.stock !== undefined ? product.stock : 10}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: PRODUCT MANAGEMENT TABLE */}
                    {activeTab === "products" && (
                        <div className="space-y-6">
                            {/* Search and Filters Bar */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                                <div className="flex-1 w-full md:w-auto relative">
                                    <input
                                        type="text"
                                        placeholder="Search by product name or description..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-blue-500 transition"
                                    />
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:bg-white focus:border-blue-500"
                                    >
                                        <option value="All">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:bg-white focus:border-blue-500"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="lowest">Price: Low to High</option>
                                        <option value="highest">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Products Table */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                                {loading ? (
                                    <div className="text-center py-16 text-gray-500">Loading product catalog...</div>
                                ) : products.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500">
                                        <p className="text-base font-semibold">No products found matching your search.</p>
                                        <button
                                            onClick={() => { setSearch(""); setCategoryFilter("All"); }}
                                            className="mt-3 text-sm text-blue-600 hover:underline"
                                        >
                                            Reset filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-gray-700">
                                            <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 font-bold border-b border-gray-200/80">
                                                <tr>
                                                    <th className="px-6 py-4">Product</th>
                                                    <th className="px-6 py-4">Category</th>
                                                    <th className="px-6 py-4">Price</th>
                                                    <th className="px-6 py-4">Stock</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {products.map((product) => (
                                                    <tr key={product._id} className="hover:bg-gray-50/70 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <img
                                                                    src={product.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"}
                                                                    alt={product.name}
                                                                    className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                                                                    onError={(e) => {
                                                                        e.target.src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
                                                                    }}
                                                                />
                                                                <div>
                                                                    <div className="font-bold text-gray-900 text-base">{product.name}</div>
                                                                    <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{product.description || "No description provided."}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                                {product.category || "General"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-bold text-emerald-600 text-base">
                                                            ₹{product.price}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {(product.stock || 10) > 0 ? (
                                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    {product.stock !== undefined ? product.stock : 10} in stock
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                                                                    Out of Stock
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => openEditModal(product)}
                                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                                    title="Edit Product"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingProduct(product)}
                                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                                    title="Delete Product"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW 3: ADD PRODUCT FORM */}
                    {activeTab === "add-product" && (
                        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Create New Store Item</h3>
                                <p className="text-xs text-gray-400 mt-1">This product will immediately appear in the student store.</p>
                            </div>

                            <form onSubmit={handleAddProduct} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Product Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Engineering Mathematics Textbook"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Price (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            placeholder="299"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Stock Quantity *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            placeholder="10"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                                        >
                                            {categories.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Image URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://images.unsplash.com/..."
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                                    />
                                    {formData.imageUrl && (
                                        <div className="mt-3 flex items-center gap-3">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Preview"
                                                className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <span className="text-xs text-gray-500">Live image preview</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Description *</label>
                                    <textarea
                                        required
                                        rows="4"
                                        placeholder="Write product specifications, condition, edition, etc..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                                    ></textarea>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition text-sm"
                                    >
                                        Save Product to Database
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("products")}
                                        className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* EDIT PRODUCT MODAL */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editFormData.price}
                                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editFormData.stock}
                                        onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Category</label>
                                    <select
                                        value={editFormData.category}
                                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={editFormData.imageUrl}
                                    onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Delete Product</h3>
                            <p className="text-gray-600 text-sm mt-2">
                                Are you sure you want to permanently delete <strong className="text-gray-900">"{deletingProduct.name}"</strong>?
                            </p>
                            <p className="text-xs text-red-500 mt-1">This action cannot be undone.</p>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleDeleteProduct}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm"
                            >
                                Yes, Delete
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingProduct(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

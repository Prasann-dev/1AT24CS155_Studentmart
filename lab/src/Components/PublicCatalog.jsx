import { useState } from "react";

const CATEGORIES = ["All", "Electronics", "Books", "Stationery", "Accessories", "Clothing"];

export default function PublicCatalog({
    products = [],
    loading = false,
    searchQuery = "",
    onSearchChange,
    selectedCategory = "All",
    onCategoryChange,
    onAddToCart,
    onBuyNow,
    onViewProduct,
    onToggleWishlist,
    wishlistIds = []
}) {
    const [sortOption, setSortOption] = useState("newest");
    const [inStockOnly, setInStockOnly] = useState(false);

    const filtered = products
        .filter((p) => {
            if (selectedCategory && selectedCategory !== "All" && p.category !== selectedCategory) {
                return false;
            }
            if (inStockOnly && typeof p.stock === "number" && p.stock <= 0) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                return (
                    (p.name || "").toLowerCase().includes(q) ||
                    (p.description || "").toLowerCase().includes(q) ||
                    (p.category || "").toLowerCase().includes(q)
                );
            }
            return true;
        })
        .sort((a, b) => {
            if (sortOption === "lowest") return Number(a.price || 0) - Number(b.price || 0);
            if (sortOption === "highest") return Number(b.price || 0) - Number(a.price || 0);
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">
            {/* Catalog Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#1d5e4b]">
                        StudentMart Catalog
                    </span>
                    <h1 className="text-3xl font-extrabold text-[#131b26] tracking-tight mt-1">
                        {selectedCategory === "All" ? "All Campus Products" : selectedCategory}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Showing {filtered.length} product{filtered.length === 1 ? "" : "s"} available to browse without login.
                    </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Filter products..."
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-[#1d5e4b] w-56 sm:w-64"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#131b26] outline-none focus:border-[#1d5e4b]"
                    >
                        <option value="newest">Sort: Featured / Newest</option>
                        <option value="lowest">Price: Low to High</option>
                        <option value="highest">Price: High to Low</option>
                    </select>

                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="accent-[#1d5e4b]"
                        />
                        <span>In Stock Only</span>
                    </label>
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onCategoryChange(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                            selectedCategory === cat
                                ? "bg-[#131b26] text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
                    Loading products...
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                    <h3 className="text-lg font-bold text-[#131b26]">No matching products</h3>
                    <p className="text-xs text-slate-500">Try clearing your search or selecting another category.</p>
                    <button
                        type="button"
                        onClick={() => {
                            onSearchChange("");
                            onCategoryChange("All");
                            setInStockOnly(false);
                        }}
                        className="px-5 py-2 rounded-xl bg-[#1d5e4b] text-white text-xs font-bold"
                    >
                        Reset Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((product) => {
                        const outOfStock = typeof product.stock === "number" && product.stock <= 0;
                        const isWishlisted = wishlistIds.includes(product._id);
                        return (
                            <div
                                key={product._id}
                                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
                            >
                                <div className="relative bg-slate-50 overflow-hidden">
                                    <img
                                        src={product.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"}
                                        alt={product.name}
                                        onClick={() => onViewProduct(product)}
                                        className="w-full h-52 object-cover cursor-pointer group-hover:scale-[1.03] transition-transform duration-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onToggleWishlist(product)}
                                        className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center transition ${
                                            isWishlisted ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                                        }`}
                                        title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                                    >
                                        <svg className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                                        <span className="font-bold text-[#1d5e4b] uppercase tracking-wider">{product.category}</span>
                                        <span className={outOfStock ? "text-rose-600 font-semibold" : "text-emerald-700 font-semibold"}>
                                            {outOfStock ? "Out of stock" : `${product.stock ?? 10} left`}
                                        </span>
                                    </div>

                                    <h3
                                        onClick={() => onViewProduct(product)}
                                        className="font-bold text-[#131b26] text-base line-clamp-1 cursor-pointer hover:text-[#1d5e4b] transition"
                                    >
                                        {product.name}
                                    </h3>

                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4">
                                        {product.description || "Verified StudentMart campus item."}
                                    </p>

                                    <div className="mt-auto pt-3 border-t border-slate-100 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-extrabold text-[#131b26]">
                                                ₹{Number(product.price).toLocaleString("en-IN")}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onViewProduct(product)}
                                                className="text-xs font-semibold text-slate-600 hover:text-[#131b26] underline"
                                            >
                                                View Specs
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={outOfStock}
                                                onClick={() => onAddToCart(product)}
                                                className="py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#131b26] text-xs font-bold transition disabled:opacity-50"
                                            >
                                                Add to Bag
                                            </button>
                                            <button
                                                type="button"
                                                disabled={outOfStock}
                                                onClick={() => onBuyNow(product)}
                                                className="py-2 rounded-xl bg-[#1d5e4b] hover:bg-[#174c3c] text-white text-xs font-bold transition disabled:opacity-50"
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

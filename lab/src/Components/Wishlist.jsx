import { useState } from "react";

export default function Wishlist({
    wishlist = [],
    loading = false,
    onRemove,
    onAddToCart,
    setActiveTab
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [addedId, setAddedId] = useState(null);

    const filtered = wishlist.filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            (item.name || "").toLowerCase().includes(q) ||
            (item.category || "").toLowerCase().includes(q)
        );
    });

    const handleMoveToCart = (product) => {
        onAddToCart(product);
        setAddedId(product._id);
        setTimeout(() => setAddedId(null), 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-[#131b26] tracking-tight">My Wishlist</h1>
                        <span className="text-xs font-bold bg-[#fdf3ef] text-[#b5483a] px-3 py-1 rounded-full border border-[#f5ddd3]">
                            {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Save your favorite campus essentials and move them to cart anytime.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter wishlist..."
                        className="px-3.5 py-2 rounded-xl border border-[#e3d9cb] bg-[#f6f1ea]/60 text-sm outline-none focus:bg-white focus:border-[#1d5e4b]"
                    />
                    <button
                        onClick={() => setActiveTab("products")}
                        className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs whitespace-nowrap"
                    >
                        Explore Store
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 text-slate-400">
                    Loading your wishlist...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {searchQuery ? "No matching wishlist items" : "Your Wishlist is Empty"}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 mb-6">
                        {searchQuery
                            ? "Try clearing your search filter."
                            : "Tap the heart icon on any product in the StudentMart store to save it here."}
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setActiveTab("products");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
                    >
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((product) => {
                        const outOfStock = typeof product.stock === "number" && product.stock <= 0;
                        return (
                            <div key={product._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                                <div className="relative">
                                    <img
                                        src={product.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"}
                                        alt={product.name}
                                        className="w-full h-48 object-cover border-b border-slate-100"
                                    />
                                    <button
                                        onClick={() => onRemove(product._id)}
                                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-rose-500 hover:bg-rose-50 shadow-sm flex items-center justify-center transition"
                                        title="Remove from Wishlist"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                            {product.category || "General"}
                                        </span>
                                        <span className={`text-[11px] font-semibold ${outOfStock ? "text-rose-600" : "text-emerald-600"}`}>
                                            {outOfStock ? "Out of Stock" : "In Stock"}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{product.name}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-3">
                                        {product.description || "StudentMart quality campus product."}
                                    </p>

                                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <span className="text-xl font-extrabold text-slate-900">₹{product.price}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onRemove(product._id)}
                                                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
                                            >
                                                Remove
                                            </button>
                                            <button
                                                onClick={() => handleMoveToCart(product)}
                                                disabled={outOfStock}
                                                className="px-4 py-2 rounded-xl bg-[#1d5e4b] hover:bg-[#174c3c] text-white text-xs font-bold transition disabled:opacity-50"
                                            >
                                                {addedId === product._id ? "Added ✓" : "Add to Cart"}
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

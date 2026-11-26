import { useState } from "react";

const CATEGORY_CARDS = [
    {
        name: "Electronics",
        tagline: "Headphones, calculators, lamps & tech",
        accent: "from-slate-900 to-slate-800 text-white"
    },
    {
        name: "Books",
        tagline: "Course textbooks & coding guides",
        accent: "from-[#f6f1ea] to-[#ede4d6] text-[#131b26]"
    },
    {
        name: "Stationery",
        tagline: "Notebooks, drafting kits & pens",
        accent: "from-[#eef5f2] to-[#dfeee6] text-[#131b26]"
    },
    {
        name: "Accessories",
        tagline: "Laptop backpacks, flasks & daily carry",
        accent: "from-[#f4f5f7] to-[#e9ecf0] text-[#131b26]"
    },
    {
        name: "Clothing",
        tagline: "Varsity hoodies & cotton campus tees",
        accent: "from-[#fdf3ef] to-[#f8e4dc] text-[#131b26]"
    }
];

export default function StorefrontHome({
    products = [],
    loading = false,
    onExploreStore,
    onSelectCategory,
    onAddToCart,
    onViewProduct,
    onBuyNow,
    onToggleWishlist,
    wishlistIds = [],
    onCopyPromo
}) {
    const [copiedCode, setCopiedCode] = useState(false);

    const featuredProduct =
        products.find((p) => p.category === "Electronics" && (p.stock ?? 10) > 0) ||
        products[0] ||
        null;

    const bestsellers = products.slice(0, 8);

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText("STUDENT10").catch(() => {});
        }
        setCopiedCode(true);
        if (onCopyPromo) onCopyPromo("STUDENT10");
        setTimeout(() => setCopiedCode(false), 2200);
    };

    return (
        <div className="space-y-16 pb-6">
            {/* Editorial Apple-Inspired Hero */}
            <section className="bg-white border-b border-slate-200/70">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f6f1ea] border border-[#e5dacb] text-xs font-semibold text-[#1d5e4b]">
                            <span className="w-2 h-2 rounded-full bg-[#1d5e4b]" />
                            <span>Official Campus Store · Instant Checkout</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#131b26] tracking-tight leading-[1.08]">
                            Everything campus life runs on.
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                            Thoughtfully curated tech, textbooks, stationery, and everyday carry — priced for students with live GPS campus delivery and instant PDF invoices.
                        </p>

                        <div className="flex flex-wrap items-center gap-3.5 pt-1">
                            <button
                                type="button"
                                onClick={onExploreStore}
                                className="bg-[#131b26] hover:bg-[#1f2c3d] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition shadow-sm"
                            >
                                Shop Store
                            </button>
                            <button
                                type="button"
                                onClick={() => onSelectCategory("Electronics")}
                                className="bg-[#eef5f2] hover:bg-[#dfeee6] text-[#1d5e4b] font-semibold px-7 py-3.5 rounded-full text-sm border border-[#d2e4dc] transition"
                            >
                                Explore Electronics →
                            </button>
                        </div>

                        <div className="pt-4 grid grid-cols-3 gap-6 max-w-md border-t border-slate-200/80">
                            <div>
                                <p className="text-xl font-extrabold text-[#131b26]">{products.length || "15"}+</p>
                                <p className="text-xs text-slate-500 mt-0.5">Campus Essentials</p>
                            </div>
                            <div>
                                <p className="text-xl font-extrabold text-[#1d5e4b]">10% OFF</p>
                                <p className="text-xs text-slate-500 mt-0.5">Code STUDENT10</p>
                            </div>
                            <div>
                                <p className="text-xl font-extrabold text-[#131b26]">₹500+</p>
                                <p className="text-xs text-slate-500 mt-0.5">Free Delivery</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Spotlight Card */}
                    <div className="lg:col-span-6">
                        {featuredProduct ? (
                            <div className="rounded-3xl bg-[#f7f7f5] border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#1d5e4b]">
                                        Featured Pick · {featuredProduct.category}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {featuredProduct.stock > 0 ? `${featuredProduct.stock} in stock` : "Limited"}
                                    </span>
                                </div>

                                <div
                                    onClick={() => onViewProduct(featuredProduct)}
                                    className="cursor-pointer rounded-2xl overflow-hidden bg-white border border-slate-200/70 mb-6"
                                >
                                    <img
                                        src={featuredProduct.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"}
                                        alt={featuredProduct.name}
                                        className="w-full h-64 sm:h-72 object-cover hover:scale-[1.02] transition-transform duration-500"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#131b26]">{featuredProduct.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                            {featuredProduct.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-2xl font-extrabold text-[#131b26]">
                                            ₹{Number(featuredProduct.price).toLocaleString("en-IN")}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onBuyNow(featuredProduct)}
                                            className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white text-xs font-bold px-5 py-2.5 rounded-full transition"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl bg-[#f7f7f5] border border-slate-200/80 h-80 flex items-center justify-center text-sm text-slate-400">
                                Loading campus storefront...
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Category Showcase */}
            <section className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131b26] tracking-tight">
                            Shop by Category
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Browse curated collections built around your semester needs.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onExploreStore}
                        className="text-xs sm:text-sm font-bold text-[#1d5e4b] hover:underline shrink-0"
                    >
                        View All Categories →
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {CATEGORY_CARDS.map((cat) => {
                        const count = products.filter((p) => p.category === cat.name).length;
                        return (
                            <button
                                key={cat.name}
                                type="button"
                                onClick={() => onSelectCategory(cat.name)}
                                className={`text-left p-5 rounded-2xl bg-gradient-to-br ${cat.accent} border border-black/5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[140px]`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-extrabold">{cat.name}</span>
                                    <span className="text-[11px] font-bold opacity-75">{count} items</span>
                                </div>
                                <div>
                                    <p className="text-xs opacity-80 leading-relaxed">{cat.tagline}</p>
                                    <span className="inline-block mt-3 text-xs font-bold">Browse →</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Bestsellers Grid */}
            <section className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131b26] tracking-tight">
                            Featured Campus Products
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Ready to ship across campus blocks and hostels.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onExploreStore}
                        className="text-xs sm:text-sm font-bold text-[#1d5e4b] hover:underline shrink-0"
                    >
                        See Full Catalog →
                    </button>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
                        Loading products...
                    </div>
                ) : bestsellers.length === 0 ? (
                    <div className="py-16 text-center text-sm text-slate-500 bg-white rounded-3xl border border-slate-200/80">
                        No products available right now.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {bestsellers.map((product) => {
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
                                                {outOfStock ? "Out of stock" : "In stock"}
                                            </span>
                                        </div>

                                        <h3
                                            onClick={() => onViewProduct(product)}
                                            className="font-bold text-[#131b26] text-base line-clamp-1 cursor-pointer hover:text-[#1d5e4b] transition"
                                        >
                                            {product.name}
                                        </h3>

                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4">
                                            {product.description || "Verified StudentMart campus essential."}
                                        </p>

                                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <span className="text-lg font-extrabold text-[#131b26]">
                                                ₹{Number(product.price).toLocaleString("en-IN")}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewProduct(product)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={outOfStock}
                                                    onClick={() => onAddToCart(product)}
                                                    className="px-3.5 py-1.5 rounded-lg bg-[#1d5e4b] hover:bg-[#174c3c] text-white text-xs font-bold transition disabled:opacity-50"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Student Offer Banner */}
            <section className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="rounded-3xl bg-[#131b26] text-white p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
                    <div className="space-y-2 max-w-xl">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#f1dec9]">
                            Student Advantage
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Save 10% on every campus order with STUDENT10.
                        </h3>
                        <p className="text-sm text-slate-300">
                            Plus free campus delivery on orders ₹500 and above, live GPS drop-off pins, and instant PDF receipts.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="px-5 py-3 rounded-full bg-[#f1dec9] hover:bg-white text-[#131b26] font-bold text-xs transition"
                        >
                            {copiedCode ? "Copied STUDENT10 ✓" : "Copy Code: STUDENT10"}
                        </button>
                        <button
                            type="button"
                            onClick={onExploreStore}
                            className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition"
                        >
                            Browse Store →
                        </button>
                    </div>
                </div>
            </section>

            {/* Reliance Digital / Retail Trust Pillars */}
            <section className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            title: "Campus-Verified Quality",
                            desc: "Genuine academic gear, electronics, and textbooks vetted for students."
                        },
                        {
                            title: "Live GPS Drop-Off",
                            desc: "Attach your exact hostel or block live location pin during checkout."
                        },
                        {
                            title: "Cash on Delivery",
                            desc: "Inspect your items at handoff and pay conveniently on delivery."
                        },
                        {
                            title: "Instant PDF Invoices",
                            desc: "Download clean itemized PDF receipts anytime from My Orders."
                        }
                    ].map((pillar) => (
                        <div key={pillar.title} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <h4 className="text-sm font-extrabold text-[#131b26]">{pillar.title}</h4>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{pillar.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

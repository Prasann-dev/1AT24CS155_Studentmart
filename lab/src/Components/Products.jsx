import { useState, useEffect } from "react";

// --- SVG Icons ---
const CheckCircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> );
const UpiIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M8 12h.01" /></svg> );
const DashedLine = () => ( <div className="w-full border-t-2 border-dashed border-gray-300 my-6" aria-hidden="true" /> );

const Barcode = ({ value }) => {
    const seedStr = String(value || "000000000000");
    const bars = Array.from({ length: 45 }).map((_, index) => {
        const code = seedStr.charCodeAt(index % seedStr.length) + index * 7;
        return <rect key={index} x={index * 5} y="10" width={code % 3 === 0 ? 3 : 1.5} height="40" />;
    });
    return (
        <div className="flex flex-col items-center py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="225" height="60" viewBox="0 0 225 60" className="fill-current text-gray-900">{bars}</svg>
            <p className="text-sm text-gray-500 tracking-[0.3em] mt-2 font-mono">{value}</p>
        </div>
    );
};

const CONFETTI_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];
const CONFETTI_PIECES = Array.from({ length: 70 }).map((_, i) => ({
    left: `${(i * 37 + 13) % 100}%`,
    top: `${-20 + ((i * 19) % 10)}%`,
    backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animation: `fall ${2 + ((i * 7) % 20) / 10}s ${((i * 11) % 10) / 10}s linear forwards`
}));

const ConfettiExplosion = () => (
    <div className="fixed inset-0 z-50 pointer-events-none">
        {CONFETTI_PIECES.map((style, i) => (
            <div key={i} className="absolute w-2 h-4 rounded-sm" style={style} />
        ))}
        <style>{`@keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
);

// --- Main Component ---
// Props specifically expect cart and setCart from Dashboard
export default function Products({
    user,
    currentTab,
    setActiveTab,
    cart,
    setCart,
    wishlistIds = [],
    onToggleWishlist,
    externalSearch = "",
    focusedProduct = null,
    onClearFocusedProduct
}) {
    const [products, setProducts] = useState([]);
    const [view, setView] = useState("grid");
    const [prevTab, setPrevTab] = useState(currentTab);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [prevFocused, setPrevFocused] = useState(null);
    
    const [receipt, setReceipt] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [ordersHistory, setOrdersHistory] = useState([]); 

    const [search, setSearch] = useState(externalSearch || "");
    const [prevExternalSearch, setPrevExternalSearch] = useState(externalSearch);
    const [category, setCategory] = useState("All");
    const [sort, setSort] = useState("");

    const categories = ["All", "Stationery", "Books", "Clothing", "Accessories", "Electronics"];

    const PORT = 5002; // PORT is safely set to 5002

    if (externalSearch !== prevExternalSearch) {
        setPrevExternalSearch(externalSearch);
        setSearch(externalSearch || "");
    }

    if (focusedProduct && focusedProduct !== prevFocused) {
        setPrevFocused(focusedProduct);
        setSelectedProduct(focusedProduct);
        setView("details");
    }

    if (currentTab !== prevTab) {
        setPrevTab(currentTab);
        if (currentTab === "products") {
            if (!focusedProduct) setView("grid");
        } else if (currentTab === "cart") setView("cart");
        else if (currentTab === "orders") setView("orders");
    }

    const userEmail = user?.email;

    useEffect(() => {
        if (currentTab !== "orders" || !userEmail) return;
        let active = true;
        fetch(`http://localhost:${PORT}/api/orders/${userEmail}`)
            .then((res) => res.json())
            .then((data) => {
                if (active) setOrdersHistory(data);
            })
            .catch((error) => console.error("Error fetching orders:", error));
        return () => { active = false; };
    }, [currentTab, userEmail]);

    useEffect(() => {
        let active = true;
        let url = `http://localhost:${PORT}/api/products?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category && category !== "All") url += `category=${encodeURIComponent(category)}&`;
        if (sort) url += `sort=${encodeURIComponent(sort)}&`;
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (active) setProducts(data);
            })
            .catch((error) => console.error("Error:", error));
        return () => { active = false; };
    }, [search, category, sort]);

    const addToCart = (product) => {
        const existing = cart.find(item => item._id === product._id);
        if (existing) setCart(cart.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i));
        else setCart([...cart, { ...product, quantity: 1 }]);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item._id !== productId));
    };

    const handleOrder = async () => {
        if (cart.length === 0) return;
        const generateId = (length) => Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
        
        const newReceipt = {
            invoiceNo: `INV-${generateId(8)}`,
            barcodeValue: generateId(12),
            username: user?.name || user?.usn || "Student User",
            email: user?.email || "No email provided",
            date: new Intl.DateTimeFormat("en-GB", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()),
            items: [...cart],
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        try {
            await fetch(`http://localhost:${PORT}/api/orders`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newReceipt)
            });
        } catch (err) { console.error("Failed to save to database", err); }

        setReceipt(newReceipt);
        setCart([]); // Clear the cart safely through the prop
        setView("bill");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e8dfd3] relative min-h-[600px]">
            {showConfetti && <ConfettiExplosion />}

            {view === "grid" && <h2 className="text-2xl font-bold text-[#131b26] mb-6 border-b border-[#f0e9df] pb-4">Student Store</h2>}
            {view === "cart" && <h2 className="text-2xl font-bold text-[#131b26] mb-6 border-b border-[#f0e9df] pb-4">Your Shopping Cart</h2>}
            {view === "orders" && <h2 className="text-2xl font-bold text-[#131b26] mb-6 border-b border-[#f0e9df] pb-4">My Orders</h2>}

            {view === "grid" && (
                <>
                    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[#f6f1ea]/70 p-3 rounded-xl border border-[#e8dfd3]">
                        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 border border-[#e3d9cb] bg-white rounded-lg px-4 py-2 outline-none focus:border-[#1d5e4b]" />
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-[#e3d9cb] rounded-lg px-4 py-2 bg-white outline-none focus:border-[#1d5e4b]"><option value="All">All Categories</option>{categories.filter(c=>c!=='All').map(c => <option key={c}>{c}</option>)}</select>
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-[#e3d9cb] rounded-lg px-4 py-2 bg-white outline-none focus:border-[#1d5e4b]"><option value="">Sort by Price</option><option value="lowest">Lowest First</option><option value="highest">Highest First</option></select>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No products found.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {products.map(product => {
                                const isWishlisted = wishlistIds.includes(product._id);
                                const outOfStock = typeof product.stock === "number" && product.stock <= 0;
                                return (
                                    <div key={product._id} className="border border-slate-200/80 rounded-2xl p-4 hover:shadow-lg transition bg-white flex flex-col relative">
                                        <div className="relative mb-4">
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-xl border border-slate-100" />
                                            {onToggleWishlist && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleWishlist(product)}
                                                    className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center transition hover:scale-105 ${
                                                        isWishlisted ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                                                    }`}
                                                    title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                                                >
                                                    <svg className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-xs font-bold text-[#1d5e4b]">{product.category}</span>
                                            <span className={`text-[11px] font-semibold ${outOfStock ? "text-rose-600" : "text-emerald-700"}`}>
                                                {outOfStock ? "Out of stock" : "In stock"}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-[#131b26] mb-1 text-lg line-clamp-1">{product.name}</h3>
                                        <div className="font-extrabold text-[#131b26] mb-4 text-xl">₹{product.price}</div>
                                        <div className="mt-auto flex gap-2">
                                            <button onClick={() => { setSelectedProduct(product); setView("details"); }} className="flex-1 py-2 border border-[#e3d9cb] rounded-xl text-sm font-semibold hover:bg-[#f6f1ea]">View</button>
                                            <button onClick={() => addToCart(product)} disabled={outOfStock} className="flex-1 py-2 bg-[#1d5e4b] text-white rounded-xl text-sm font-semibold hover:bg-[#174c3c] disabled:opacity-50">Add to Cart</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {view === "cart" && (
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setActiveTab("products")} className="text-blue-600 mb-6 font-semibold flex items-center gap-2 hover:underline">← Continue Shopping</button>
                    {cart.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                            <p className="text-gray-500 mb-4">Your cart is empty.</p>
                            <button onClick={() => setActiveTab("products")} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">Browse Products</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item._id} className="flex items-center justify-between border p-4 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-4"><img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg border" /><div><h3 className="font-bold text-gray-900">{item.name}</h3><p className="text-gray-500 text-sm">Qty: {item.quantity} x ₹{item.price}</p></div></div>
                                    <div className="flex items-center gap-6"><span className="font-bold text-lg">₹{item.price * item.quantity}</span><button onClick={() => removeFromCart(item._id)} className="text-red-500 bg-red-50 px-3 py-1 rounded-lg text-sm font-bold">Remove</button></div>
                                </div>
                            ))}
                            <div className="border-t border-[#f0e9df] pt-6 mt-6 flex justify-between items-center"><span className="text-xl font-bold text-[#131b26]">Total Amount:</span><span className="text-3xl font-extrabold text-[#1d5e4b]">₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span></div>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button onClick={() => setActiveTab("checkout")} className="flex-1 bg-[#1d5e4b] text-white font-bold py-4 rounded-xl hover:bg-[#174c3c] text-lg shadow-lg">Proceed to Checkout →</button>
                                <button onClick={handleOrder} className="sm:w-56 bg-[#131b26] text-[#f1dec9] font-bold py-4 rounded-xl hover:bg-[#1f2c3d] text-base shadow-lg">Quick Pay via UPI</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === "orders" && (
                <div className="max-w-4xl mx-auto space-y-5">
                    {ordersHistory.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-500">You haven't placed any orders yet.</div>
                    ) : (
                        ordersHistory.map(order => (
                            <div key={order._id} className="border p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition">
                                <div className="flex justify-between border-b pb-4 mb-4 items-center">
                                    <div><span className="font-extrabold text-lg text-gray-900">{order.invoiceNo}</span><span className="text-gray-500 text-sm ml-4 font-semibold">{order.date}</span></div>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>
                                </div>
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm mt-2 text-gray-700 font-medium">
                                        <span>{item.name} <span className="text-gray-400 ml-2">x{item.quantity}</span></span>
                                        <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div className="mt-5 pt-4 border-t text-right flex justify-end items-center gap-4">
                                    <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Total Paid</span>
                                    <span className="text-2xl font-extrabold text-blue-600">₹{order.total}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === "bill" && receipt && (
                <div className="flex justify-center py-4 bg-gray-50 rounded-xl">
                    <div className="relative w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl overflow-hidden font-sans border border-gray-200">
                        <div className="absolute -left-4 top-[55%] -translate-y-1/2 w-8 h-8 rounded-full bg-gray-50 border-r border-gray-200" />
                        <div className="absolute -right-4 top-[55%] -translate-y-1/2 w-8 h-8 rounded-full bg-gray-50 border-l border-gray-200" />
                        <div className="p-8 flex flex-col items-center text-center bg-green-50/50"><div className="p-4 bg-green-100 rounded-full mb-4 shadow-sm"><CheckCircleIcon /></div><h1 className="text-3xl font-extrabold text-gray-900">Payment Successful</h1><p className="text-gray-500 font-medium mt-1">Your order has been placed</p></div>
                        <div className="px-8 pb-8">
                            <div className="grid grid-cols-2 gap-4 text-left mt-2"><div><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Invoice No</p><p className="font-mono font-bold text-gray-800">{receipt.invoiceNo}</p></div><div className="text-right"><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Amount</p><p className="font-extrabold text-2xl text-blue-600">₹{receipt.total}</p></div></div>
                            <DashedLine />
                            <div className="space-y-4"><div><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Customer Details</p><p className="font-bold text-gray-800">{receipt.username}</p><p className="text-sm text-gray-500">{receipt.email}</p></div></div>
                            <DashedLine />
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-gray-100"><div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"><UpiIcon /></div><div><p className="font-bold text-gray-800">UPI Payment</p><p className="text-gray-500 font-mono text-xs font-semibold tracking-wider">Txn: UPI{receipt.barcodeValue.substring(0, 8)}</p></div></div>
                            <DashedLine />
                            <Barcode value={receipt.barcodeValue} />
                            <button onClick={() => { setView("grid"); setActiveTab("products"); }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-6 hover:bg-blue-700 transition">Continue Shopping</button>
                        </div>
                    </div>
                </div>
            )}

            {view === "details" && selectedProduct && (
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => { setView("grid"); if (onClearFocusedProduct) onClearFocusedProduct(); setActiveTab("products"); }} className="text-[#1d5e4b] mb-6 font-semibold flex items-center gap-2 hover:underline">← Back to Store</button>
                    <div className="flex flex-col md:flex-row gap-8 bg-[#f6f1ea]/70 p-6 rounded-2xl border border-[#e8dfd3]">
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full md:w-1/2 h-80 object-cover rounded-xl border border-[#e8dfd3] shadow-sm" />
                        <div className="flex flex-col justify-center flex-1">
                            <span className="bg-[#eef5f2] text-[#1d5e4b] px-3 py-1 rounded-full text-xs font-bold w-fit mb-3">{selectedProduct.category}</span>
                            <h2 className="text-3xl font-extrabold text-[#131b26] mb-2">{selectedProduct.name}</h2>
                            <p className="text-3xl font-bold text-[#131b26] mb-6">₹{selectedProduct.price}</p>
                            <p className="text-slate-600 mb-8 leading-relaxed">{selectedProduct.description}</p>
                            <div className="flex gap-3">
                                <button onClick={() => { addToCart(selectedProduct); setActiveTab("cart"); }} className="flex-1 bg-[#1d5e4b] text-white font-bold py-4 rounded-xl hover:bg-[#174c3c] shadow-lg text-lg">Add to Cart & Checkout</button>
                                {onToggleWishlist && (
                                    <button
                                        type="button"
                                        onClick={() => onToggleWishlist(selectedProduct)}
                                        className={`px-4 rounded-xl border font-bold text-sm transition flex items-center justify-center ${
                                            wishlistIds.includes(selectedProduct._id)
                                                ? "bg-rose-50 border-rose-200 text-rose-600"
                                                : "bg-white border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                                        }`}
                                        title="Toggle Wishlist"
                                    >
                                        <svg className="w-5 h-5" fill={wishlistIds.includes(selectedProduct._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default function CartDrawer({
    isOpen,
    onClose,
    cart,
    onUpdateQuantity,
    onRemove,
    onCheckout
}) {
    if (!isOpen) return null;

    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
    const freeDeliveryThreshold = 500;
    const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);
    const deliveryFee = subtotal === 0 || subtotal >= freeDeliveryThreshold ? 0 : 40;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            />

            {/* Drawer Panel */}
            <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
                <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#131b26] tracking-tight">Shopping Bag</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {totalItems} {totalItems === 1 ? "item" : "items"} selected
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center transition"
                        aria-label="Close shopping bag"
                    >
                        ✕
                    </button>
                </div>

                {/* Free Delivery Progress */}
                {cart.length > 0 && (
                    <div className="px-6 py-3 bg-[#f6f1ea] border-b border-[#e8dfd3] text-xs">
                        {remainingForFree === 0 ? (
                            <p className="font-semibold text-[#1d5e4b]">
                                You unlocked FREE campus delivery on this order.
                            </p>
                        ) : (
                            <p className="text-slate-700">
                                Add <strong className="text-[#131b26]">₹{remainingForFree}</strong> more to qualify for <strong>FREE delivery</strong>.
                            </p>
                        )}
                        <div className="w-full h-1.5 bg-[#e5dccf] rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-[#1d5e4b] transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
                    {cart.length === 0 ? (
                        <div className="py-20 text-center space-y-3">
                            <div className="w-14 h-14 rounded-full bg-[#f6f1ea] text-[#1d5e4b] flex items-center justify-center mx-auto">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-[#131b26]">Your bag is empty</h3>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                Explore campus electronics, textbooks, stationery, and essentials to add items here.
                            </p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item._id} className="py-4 flex gap-4">
                                <img
                                    src={item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=160&q=80"}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-xl object-cover border border-slate-200/80 shrink-0 bg-slate-50"
                                />
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm font-bold text-[#131b26] line-clamp-1">{item.name}</h4>
                                            <button
                                                type="button"
                                                onClick={() => onRemove(item._id)}
                                                className="text-[11px] font-semibold text-rose-500 hover:underline shrink-0"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                                            <button
                                                type="button"
                                                onClick={() => onUpdateQuantity(item._id, -1)}
                                                className="w-7 h-7 text-sm font-bold text-slate-700 hover:bg-slate-200/60 rounded-l-lg"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold text-[#131b26]">
                                                {item.quantity || 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onUpdateQuantity(item._id, 1)}
                                                className="w-7 h-7 text-sm font-bold text-slate-700 hover:bg-slate-200/60 rounded-r-lg"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="text-sm font-extrabold text-[#131b26]">
                                            ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Totals & Checkout */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-slate-200 bg-[#faf9f7] space-y-4">
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-[#131b26]">₹{subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Delivery</span>
                                <span className="font-semibold text-[#1d5e4b]">
                                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm font-extrabold text-[#131b26] pt-2 border-t border-slate-200">
                                <span>Estimated Total</span>
                                <span>₹{(subtotal + deliveryFee).toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onCheckout}
                            className="w-full bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                        >
                            <span>Proceed to Checkout</span>
                            <span>→</span>
                        </button>
                        <p className="text-[11px] text-center text-slate-500">
                            Apply code <span className="font-mono font-bold text-[#131b26]">STUDENT10</span> at checkout for 10% OFF.
                        </p>
                    </div>
                )}
            </aside>
        </div>
    );
}

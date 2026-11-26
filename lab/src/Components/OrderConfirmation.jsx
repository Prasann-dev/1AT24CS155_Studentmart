import { useState } from "react";
import { downloadOrderInvoice } from "../utils/invoiceGenerator";

export default function OrderConfirmation({ order, setActiveTab }) {
    const [copied, setCopied] = useState(false);

    if (!order) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-xl mx-auto my-10">
                <p className="text-gray-500 mb-4">No recent order details available.</p>
                <button
                    onClick={() => setActiveTab("products")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-sm"
                >
                    Return to Store
                </button>
            </div>
        );
    }

    const orderId = order.orderId || order.invoiceNo || order._id;
    const address = order.deliveryAddress || {};
    const items = order.items || [];
    const formattedDate = order.createdAt 
        ? new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(order.createdAt))
        : new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(new Date());

    const copyOrderId = () => {
        if (orderId) {
            navigator.clipboard.writeText(orderId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6 px-4">
            {/* Top Success Banner */}
            <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-xl shadow-green-900/5 text-center mb-8 relative overflow-hidden">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3 border border-green-200">
                    ORDER CONFIRMED
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                    Thank You for Your Order!
                </h1>
                <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
                    Your order has been successfully placed. We've notified our fulfillment team and your items are being prepared.
                </p>

                {/* Order ID & Date Pill */}
                <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-gray-50 border border-gray-200/80 px-4 py-2.5 rounded-2xl text-sm">
                    <span className="text-gray-500 font-medium">Order ID:</span>
                    <span className="font-mono font-bold text-gray-900">{orderId}</span>
                    <button
                        onClick={copyOrderId}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1 ml-1"
                        title="Copy Order ID"
                    >
                        {copied ? (
                            <span className="text-green-600 font-bold">✓ Copied</span>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{formattedDate}</span>
                </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                    onClick={() => setActiveTab("orders")}
                    className="flex-1 bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>View & Track in My Orders</span>
                </button>
                <button
                    type="button"
                    onClick={() => downloadOrderInvoice(order)}
                    className="flex-1 bg-[#f1dec9] hover:bg-[#e7ceb2] text-[#131b26] font-bold py-3.5 px-6 rounded-2xl border border-[#e3ccb0] transition shadow-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download Invoice (PDF)</span>
                </button>
                <button
                    onClick={() => setActiveTab("products")}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-6 rounded-2xl border border-gray-200 transition shadow-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    <span>Continue Shopping</span>
                </button>
            </div>

            {/* Order Details & Summary Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                {/* 2 Column Section: Delivery Address & Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                    {/* Delivery Address */}
                    <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>Delivery Address</span>
                        </div>
                        <p className="font-bold text-gray-900 text-base">{address.fullName || order.customer?.name}</p>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                            {address.houseNo}, {address.street}
                            {address.landmark ? `, Near ${address.landmark}` : ""}
                            <br />
                            {address.city}, {address.state} - <span className="font-semibold text-gray-800">{address.pincode}</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-2 font-medium">
                            Phone: <span className="text-gray-800 font-semibold">{address.mobile || order.customer?.phone}</span>
                            {address.alternatePhone && ` | Alt: ${address.alternatePhone}`}
                        </p>
                        {address.location?.latitude !== null && address.location?.latitude !== undefined && (
                            <a
                                href={address.location.mapUrl || `https://www.google.com/maps?q=${address.location.latitude},${address.location.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1d5e4b] bg-[#eef5f2] px-2.5 py-1 rounded-lg border border-[#d2e4dc] hover:underline"
                            >
                                📍 Live Location Pin ({address.location.latitude}, {address.location.longitude}) ↗
                            </a>
                        )}
                    </div>

                    {/* Payment & Delivery Status */}
                    <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wider mb-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                                    <line x1="2" y1="10" x2="22" y2="10"/>
                                </svg>
                                <span>Payment & Delivery</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-gray-600 text-sm">Payment Method:</span>
                                <span className="font-bold text-gray-900 text-sm bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                                    {order.paymentMethod || "Cash on Delivery"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-gray-600 text-sm">Payment Status:</span>
                                <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg text-xs border border-amber-200">
                                    {order.paymentStatus || "Pending (Pay on Delivery)"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-gray-600 text-sm">Order Status:</span>
                                <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg text-xs">
                                    {order.orderStatus || "Placed"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs text-gray-500 flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span>Estimated Delivery: <strong>3 - 5 business days</strong></span>
                        </div>
                    </div>
                </div>

                {/* Ordered Items List */}
                <div>
                    <h3 className="text-base font-extrabold text-gray-900 mb-4 flex items-center justify-between">
                        <span>Items in This Order</span>
                        <span className="text-xs font-semibold text-gray-500">
                            {order.totalItems || items.length} {items.length === 1 ? "item" : "items"}
                        </span>
                    </h3>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3.5">
                                    <img
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=80"}
                                        alt={item.name}
                                        className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0 bg-white"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Qty: <span className="font-bold text-gray-800">{item.quantity}</span> × ₹{item.price}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-extrabold text-gray-900 text-sm">
                                        ₹{item.subtotal || (item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bill Breakdown */}
                <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium text-gray-900">₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Delivery Charges:</span>
                        <span className="font-medium text-gray-900">
                            {order.deliveryCharges > 0 ? `₹${order.deliveryCharges}` : <span className="text-green-600 font-bold">FREE</span>}
                        </span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Discount:</span>
                            <span>- ₹{order.discount}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-base font-extrabold text-gray-900">
                        <span>Total Payable Amount:</span>
                        <span className="text-2xl text-blue-600 font-black">₹{order.finalTotal || order.total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

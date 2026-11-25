import { useState, useEffect, useCallback } from "react";

export default function Checkout({
    user,
    token,
    cart,
    setCart,
    setActiveTab,
    onOrderPlaced,
    initialPromoCode = ""
}) {
    // Current active checkout step: 1 = Address, 2 = Order Summary, 3 = Payment Method
    const [currentStep, setCurrentStep] = useState(1);

    // Address management state
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);

    // Address Form Data
    const [addressForm, setAddressForm] = useState({
        fullName: user?.name || "",
        mobile: user?.phone || "",
        email: user?.email || "",
        houseNo: "",
        street: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        alternatePhone: "",
        isDefault: false
    });
    const [addressErrors, setAddressErrors] = useState({});
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Payment & Promo state
    const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
    const [promoInput, setPromoInput] = useState(initialPromoCode || "");
    const [appliedPromo, setAppliedPromo] = useState(
        (initialPromoCode || "").trim().toUpperCase() === "STUDENT10" ? "STUDENT10" : ""
    );
    const [promoFeedback, setPromoFeedback] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");

    const PORT = 5002;
    const authToken = token || localStorage.getItem("token");

    const getHeaders = useCallback(() => ({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
    }), [authToken]);

    const fetchAddresses = useCallback(async () => {
        if (!authToken) return;
        setLoadingAddresses(true);
        try {
            const res = await fetch(`http://localhost:${PORT}/api/addresses`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
                if (data.length > 0) {
                    const defaultAddr = data.find(a => a.isDefault) || data[0];
                    setSelectedAddressId(defaultAddr._id);
                    setShowAddressForm(false);
                } else {
                    setShowAddressForm(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoadingAddresses(false);
        }
    }, [authToken, getHeaders]);

    // Load addresses on component mount
    useEffect(() => {
        if (!authToken) return;
        let active = true;
        fetch(`http://localhost:${PORT}/api/addresses`, {
            headers: getHeaders()
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!active || !data) return;
                setAddresses(data);
                if (data.length > 0) {
                    const defaultAddr = data.find(a => a.isDefault) || data[0];
                    setSelectedAddressId(defaultAddr._id);
                    setShowAddressForm(false);
                } else {
                    setShowAddressForm(true);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch addresses:", error);
            })
            .finally(() => {
                if (active) setLoadingAddresses(false);
            });
        return () => { active = false; };
    }, [authToken, getHeaders]);

    // Calculate totals
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const deliveryCharges = subtotal >= 500 ? 0 : 40;
    const discount = appliedPromo === "STUDENT10" ? Math.round(subtotal * 0.1) : 0;
    const finalTotal = Math.max(0, subtotal + deliveryCharges - discount);

    const handleApplyPromo = (codeToTry = promoInput) => {
        const normalized = String(codeToTry || "").trim().toUpperCase();
        if (!normalized) {
            setAppliedPromo("");
            setPromoFeedback("");
            return;
        }
        if (normalized === "STUDENT10") {
            setAppliedPromo("STUDENT10");
            setPromoInput("STUDENT10");
            setPromoFeedback("STUDENT10 applied — 10% student discount!");
        } else {
            setAppliedPromo("");
            setPromoFeedback("Invalid promo code. Try STUDENT10 for 10% OFF.");
        }
    };

    // Cart Quantity updates
    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item._id === productId) {
                const newQty = (item.quantity || 1) + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item._id !== productId));
    };

    // Validate Address Form
    const validateAddressForm = () => {
        const errors = {};
        if (!addressForm.fullName.trim()) errors.fullName = "Full name is required.";
        
        const phoneClean = addressForm.mobile.replace(/[\s-]/g, "");
        if (!phoneClean) {
            errors.mobile = "Mobile number is required.";
        } else if (!/^[6-9]\d{9}$/.test(phoneClean) && !/^\+91[6-9]\d{9}$/.test(phoneClean)) {
            errors.mobile = "Enter a valid 10-digit mobile number.";
        }

        const emailClean = addressForm.email.trim();
        if (!emailClean) {
            errors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
            errors.email = "Enter a valid email address.";
        }

        if (!addressForm.houseNo.trim()) errors.houseNo = "Flat / House / Building no. is required.";
        if (!addressForm.street.trim()) errors.street = "Street / Area / Colony is required.";
        if (!addressForm.city.trim()) errors.city = "City is required.";
        if (!addressForm.state.trim()) errors.state = "State is required.";

        const pinClean = addressForm.pincode.trim();
        if (!pinClean) {
            errors.pincode = "PIN code is required.";
        } else if (!/^[1-9][0-9]{5}$/.test(pinClean)) {
            errors.pincode = "Enter a valid 6-digit PIN code.";
        }

        if (addressForm.alternatePhone.trim()) {
            const altPhoneClean = addressForm.alternatePhone.replace(/[\s-]/g, "");
            if (!/^[6-9]\d{9}$/.test(altPhoneClean) && !/^\+91[6-9]\d{9}$/.test(altPhoneClean)) {
                errors.alternatePhone = "Enter a valid 10-digit alternate phone number.";
            }
        }

        setAddressErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save or Update Address
    const handleSaveAddress = async (e) => {
        e.preventDefault();
        if (!validateAddressForm()) return;

        setIsSavingAddress(true);
        setCheckoutError("");
        try {
            const endpoint = editingAddressId
                ? `http://localhost:${PORT}/api/addresses/${editingAddressId}`
                : `http://localhost:${PORT}/api/addresses`;
            const method = editingAddressId ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(addressForm)
            });

            const data = await res.json();
            if (!res.ok) {
                setCheckoutError(data.message || "Failed to save address.");
                return;
            }

            await fetchAddresses();
            setSelectedAddressId(data._id || editingAddressId);
            setShowAddressForm(false);
            setEditingAddressId(null);
            setAddressForm({
                fullName: user?.name || "",
                mobile: user?.phone || "",
                email: user?.email || "",
                houseNo: "",
                street: "",
                landmark: "",
                city: "",
                state: "",
                pincode: "",
                alternatePhone: "",
                isDefault: false
            });
        } catch (error) {
            console.error("Save address error:", error);
            setCheckoutError("Failed to save address. Please check server connection.");
        } finally {
            setIsSavingAddress(false);
        }
    };

    // Edit address
    const handleEditAddress = (addr) => {
        setEditingAddressId(addr._id);
        setAddressForm({
            fullName: addr.fullName,
            mobile: addr.mobile,
            email: addr.email,
            houseNo: addr.houseNo,
            street: addr.street,
            landmark: addr.landmark || "",
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            alternatePhone: addr.alternatePhone || "",
            isDefault: addr.isDefault || false
        });
        setAddressErrors({});
        setShowAddressForm(true);
    };

    // Delete address
    const handleDeleteAddress = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this delivery address?")) return;

        try {
            const res = await fetch(`http://localhost:${PORT}/api/addresses/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (res.ok) {
                await fetchAddresses();
            }
        } catch (error) {
            console.error("Delete address error:", error);
        }
    };

    // Place Order handler
    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            setCurrentStep(1);
            setCheckoutError("Please select or add a delivery address to proceed.");
            return;
        }

        if (cart.length === 0) {
            setCheckoutError("Your cart is empty.");
            return;
        }

        setIsPlacingOrder(true);
        setCheckoutError("");

        try {
            const orderPayload = {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod,
                promoCode: appliedPromo,
                items: cart.map(item => ({
                    productId: item._id,
                    quantity: item.quantity || 1
                }))
            };

            const res = await fetch(`http://localhost:${PORT}/api/orders`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(orderPayload)
            });

            const data = await res.json();

            if (!res.ok) {
                setCheckoutError(data.message || "Failed to place order. Please review your cart.");
                setIsPlacingOrder(false);
                return;
            }

            // Successfully created order!
            // 1. Clear cart
            setCart([]);
            // 2. Invoke callback to display confirmation screen
            if (onOrderPlaced) {
                onOrderPlaced(data.order);
            }
        } catch (error) {
            console.error("Place order failed:", error);
            setCheckoutError("Failed to connect to order server. Please try again.");
            setIsPlacingOrder(false);
        }
    };

    // If Cart is Empty and not in confirmation
    if (cart.length === 0) {
        return (
            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto my-12">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
                <button
                    onClick={() => setActiveTab("products")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-md"
                >
                    Explore Campus Store
                </button>
            </div>
        );
    }

    const selectedAddress = addresses.find(a => a._id === selectedAddressId);

    return (
        <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4">
            {/* Header & Steps Progress */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setActiveTab("cart")}
                        className="text-gray-500 hover:text-gray-800 transition flex items-center gap-1.5 text-sm font-semibold"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                        <span>Back to Cart</span>
                    </button>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
                </div>

                {/* Step indicator bar */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
                    {/* Step 1 */}
                    <div
                        onClick={() => setCurrentStep(1)}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                            currentStep === 1
                                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                : currentStep > 1
                                ? "bg-white border-green-200 text-green-700 hover:bg-gray-50"
                                : "bg-white border-gray-200 text-gray-400"
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            currentStep === 1
                                ? "bg-blue-600 text-white"
                                : currentStep > 1
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                        }`}>
                            {currentStep > 1 ? "✓" : "1"}
                        </div>
                        <div className="min-w-0 hidden sm:block">
                            <p className="text-xs font-bold uppercase tracking-wider">Step 1</p>
                            <p className="text-xs font-semibold truncate">Delivery Address</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div
                        onClick={() => selectedAddressId && setCurrentStep(2)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            !selectedAddressId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
                        } ${
                            currentStep === 2
                                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                : currentStep > 2
                                ? "bg-white border-green-200 text-green-700"
                                : "bg-white border-gray-200 text-gray-400"
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            currentStep === 2
                                ? "bg-blue-600 text-white"
                                : currentStep > 2
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                        }`}>
                            {currentStep > 2 ? "✓" : "2"}
                        </div>
                        <div className="min-w-0 hidden sm:block">
                            <p className="text-xs font-bold uppercase tracking-wider">Step 2</p>
                            <p className="text-xs font-semibold truncate">Order Summary</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div
                        onClick={() => selectedAddressId && setCurrentStep(3)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            !selectedAddressId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
                        } ${
                            currentStep === 3
                                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                : "bg-white border-gray-200 text-gray-400"
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            currentStep === 3
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-600"
                        }`}>
                            3
                        </div>
                        <div className="min-w-0 hidden sm:block">
                            <p className="text-xs font-bold uppercase tracking-wider">Step 3</p>
                            <p className="text-xs font-semibold truncate">Payment</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Notification */}
            {checkoutError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>{checkoutError}</span>
                    </div>
                    <button onClick={() => setCheckoutError("")} className="text-red-400 hover:text-red-700 text-xs font-bold">Dismiss</button>
                </div>
            )}

            {/* Checkout Main 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Active Step Details (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* STEP 1: DELIVERY ADDRESS */}
                    {currentStep === 1 && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">1</span>
                                        <span>Select Delivery Address</span>
                                    </h2>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Choose where you want your order delivered or add a new address.
                                    </p>
                                </div>
                                {!showAddressForm && (
                                    <button
                                        onClick={() => {
                                            setEditingAddressId(null);
                                            setAddressForm({
                                                fullName: user?.name || "",
                                                mobile: user?.phone || "",
                                                email: user?.email || "",
                                                houseNo: "",
                                                street: "",
                                                landmark: "",
                                                city: "",
                                                state: "",
                                                pincode: "",
                                                alternatePhone: "",
                                                isDefault: addresses.length === 0
                                            });
                                            setAddressErrors({});
                                            setShowAddressForm(true);
                                        }}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-blue-200 flex items-center gap-1.5 self-start sm:self-auto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14"/>
                                        </svg>
                                        <span>+ Add New Address</span>
                                    </button>
                                )}
                            </div>

                            {/* Address Form (Add / Edit) */}
                            {showAddressForm && (
                                <form onSubmit={handleSaveAddress} className="mt-6 bg-blue-50/40 p-6 rounded-2xl border border-blue-100 space-y-4">
                                    <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                                        <h3 className="font-bold text-gray-900 text-sm">
                                            {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                                        </h3>
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddressForm(false);
                                                    setEditingAddressId(null);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                                            >
                                                ✕ Cancel
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.fullName}
                                                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                                placeholder="e.g. Rahul Sharma"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.fullName ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.fullName && <p className="text-red-500 text-[11px] mt-1">{addressErrors.fullName}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Mobile Number (10 digits) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={addressForm.mobile}
                                                onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                                                placeholder="e.g. 9876543210"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.mobile ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.mobile && <p className="text-red-500 text-[11px] mt-1">{addressErrors.mobile}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={addressForm.email}
                                                onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                                                placeholder="e.g. student@college.edu"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.email ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.email && <p className="text-red-500 text-[11px] mt-1">{addressErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                House / Flat / Building No. <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.houseNo}
                                                onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
                                                placeholder="e.g. Room 402, Hostel Block B"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.houseNo ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.houseNo && <p className="text-red-500 text-[11px] mt-1">{addressErrors.houseNo}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Street / Area / Road <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.street}
                                                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                                placeholder="e.g. University Main Campus Road"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.street ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.street && <p className="text-red-500 text-[11px] mt-1">{addressErrors.street}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Landmark <span className="text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.landmark}
                                                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                                                placeholder="e.g. Near Central Library"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.city}
                                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                placeholder="e.g. Bangalore"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.city ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.city && <p className="text-red-500 text-[11px] mt-1">{addressErrors.city}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                State <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.state}
                                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                                placeholder="e.g. Karnataka"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.state ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.state && <p className="text-red-500 text-[11px] mt-1">{addressErrors.state}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                PIN Code (6 digits) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                value={addressForm.pincode}
                                                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                placeholder="e.g. 560001"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                    addressErrors.pincode ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                                }`}
                                            />
                                            {addressErrors.pincode && <p className="text-red-500 text-[11px] mt-1">{addressErrors.pincode}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Alternative Phone <span className="text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={addressForm.alternatePhone}
                                            onChange={(e) => setAddressForm({ ...addressForm, alternatePhone: e.target.value })}
                                            placeholder="e.g. 9123456780"
                                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm outline-none transition ${
                                                addressErrors.alternatePhone ? "border-red-400 bg-red-50/20" : "border-gray-300 focus:border-blue-500"
                                            }`}
                                        />
                                        {addressErrors.alternatePhone && <p className="text-red-500 text-[11px] mt-1">{addressErrors.alternatePhone}</p>}
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            checked={addressForm.isDefault}
                                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <label htmlFor="isDefault" className="text-xs text-gray-700 cursor-pointer select-none">
                                            Make this my default delivery address
                                        </label>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSavingAddress}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSavingAddress ? "Saving..." : (editingAddressId ? "Update Address" : "Save & Deliver Here")}
                                        </button>
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddressForm(false);
                                                    setEditingAddressId(null);
                                                }}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* Saved Addresses List */}
                            <div className="mt-6 space-y-4">
                                {loadingAddresses ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">Loading saved addresses...</div>
                                ) : addresses.length === 0 && !showAddressForm ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        No addresses saved yet. Click "Add New Address" above.
                                    </div>
                                ) : (
                                    addresses.map((addr) => {
                                        const isSelected = selectedAddressId === addr._id;
                                        return (
                                            <div
                                                key={addr._id}
                                                onClick={() => setSelectedAddressId(addr._id)}
                                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                                                    isSelected
                                                        ? "border-blue-600 bg-blue-50/30 shadow-md"
                                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3.5">
                                                        <div className="pt-0.5">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                                isSelected ? "border-blue-600" : "border-gray-300"
                                                            }`}>
                                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-extrabold text-gray-900 text-sm">{addr.fullName}</h4>
                                                                {addr.isDefault && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                                                                {addr.houseNo}, {addr.street}
                                                                {addr.landmark ? `, Near ${addr.landmark}` : ""}
                                                                <br />
                                                                {addr.city}, {addr.state} - <span className="font-bold text-gray-800">{addr.pincode}</span>
                                                            </p>
                                                            <p className="text-gray-500 text-xs mt-2 font-medium">
                                                                Phone: <span className="text-gray-800 font-semibold">{addr.mobile}</span>
                                                                {addr.alternatePhone && ` | Alt: ${addr.alternatePhone}`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Actions (Edit / Delete) */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditAddress(addr);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 hover:bg-blue-50 rounded-lg transition"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteAddress(addr._id, e)}
                                                            className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="mt-4 pt-3 border-t border-blue-100/80 flex items-center justify-between">
                                                        <span className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                                            Deliver to this address
                                                        </span>
                                                        <button
                                                            onClick={() => setCurrentStep(2)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition shadow-sm"
                                                        >
                                                            Deliver Here →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Continue Button */}
                            {addresses.length > 0 && selectedAddressId && !showAddressForm && (
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center gap-2"
                                    >
                                        <span>Proceed to Order Summary</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: ORDER SUMMARY */}
                    {currentStep === 2 && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">2</span>
                                    <span>Review Order Items ({totalItems})</span>
                                </h2>
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                                >
                                    <span>Change Address</span>
                                </button>
                            </div>

                            {/* Delivery Address Pill Summary */}
                            {selectedAddress && (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between gap-4">
                                    <div className="text-xs">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Shipping To:</span>
                                        <p className="font-bold text-gray-900">{selectedAddress.fullName} · {selectedAddress.mobile}</p>
                                        <p className="text-gray-600 mt-0.5">
                                            {selectedAddress.houseNo}, {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="text-blue-600 hover:underline text-xs font-bold"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}

                            {/* Cart Items List */}
                            <div className="divide-y divide-gray-100">
                                {cart.map((item) => (
                                    <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&q=80"}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-2xl border border-gray-100 shrink-0 bg-white"
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Price: <span className="font-semibold text-gray-800">₹{item.price}</span>
                                                </p>
                                                <span className="inline-block mt-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {item.category || "Store Item"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6">
                                            {/* Quantity adjustment controls */}
                                            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/60 p-1">
                                                <button
                                                    onClick={() => updateQuantity(item._id, -1)}
                                                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center hover:bg-gray-100 transition shadow-sm text-sm"
                                                    title="Decrease quantity"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-bold text-sm text-gray-900">
                                                    {item.quantity || 1}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, 1)}
                                                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center hover:bg-gray-100 transition shadow-sm text-sm"
                                                    title="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Subtotal & Remove */}
                                            <div className="text-right min-w-[80px]">
                                                <p className="font-extrabold text-gray-900 text-base">
                                                    ₹{Number(item.price) * (item.quantity || 1)}
                                                </p>
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline mt-0.5"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Back and Next navigation buttons */}
                            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="text-gray-600 hover:text-gray-900 font-semibold text-xs flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="m15 18-6-6 6-6"/>
                                    </svg>
                                    <span>Back to Address</span>
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center gap-2"
                                >
                                    <span>Proceed to Payment</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PAYMENT METHOD */}
                    {currentStep === 3 && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
                            <div className="pb-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">3</span>
                                    <span>Choose Payment Method</span>
                                </h2>
                                <p className="text-gray-500 text-xs mt-1">
                                    Select your preferred payment mode to finalize your purchase.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Option 1: Cash on Delivery (ACTIVE) */}
                                <div
                                    onClick={() => setPaymentMethod("Cash on Delivery")}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                        paymentMethod === "Cash on Delivery"
                                            ? "border-green-600 bg-green-50/30 shadow-md"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="pt-0.5">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                paymentMethod === "Cash on Delivery" ? "border-green-600" : "border-gray-300"
                                            }`}>
                                                {paymentMethod === "Cash on Delivery" && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-gray-900 text-sm">Cash on Delivery (COD)</h4>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                                                    Recommended
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                                                Pay cash to the delivery agent directly when your package is handed over at your doorstep. No advance payment required.
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <rect width="20" height="12" x="2" y="6" rx="2"/>
                                                <circle cx="12" cy="12" r="2"/>
                                                <path d="M6 12h.01M18 12h.01"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Option 2: Online Payment / Razorpay (Extensible Architecture - Disabled / Coming Soon) */}
                                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-gray-50/60 opacity-75 relative">
                                    <div className="flex items-start gap-4">
                                        <div className="pt-0.5">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-500 text-sm">Online Gateway (UPI, Cards, NetBanking, Razorpay)</h4>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                                                    Integration Ready / Coming Soon
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                                Direct payment gateway integration hook. Available for production deployment with Razorpay/Stripe keys.
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-400 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <rect width="20" height="14" x="2" y="5" rx="2"/>
                                                <line x1="2" y1="10" x2="22" y2="10"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-3 text-xs text-blue-800">
                                <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                                <span>
                                    <strong>Safe & Transparent:</strong> Verified campus delivery with zero hidden surcharges. Inspect items before receiving.
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="text-gray-600 hover:text-gray-900 font-semibold text-xs flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="m15 18-6-6 6-6"/>
                                    </svg>
                                    <span>Back to Summary</span>
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacingOrder}
                                    className="bg-green-600 hover:bg-green-700 text-white font-extrabold py-3.5 px-8 rounded-2xl text-sm transition shadow-lg shadow-green-600/25 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isPlacingOrder ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Processing Order...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Place Order (Cash on Delivery)</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Price Summary Card (4 Cols - Sticky) */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm sticky top-6 space-y-5">
                        <h3 className="font-extrabold text-gray-900 text-base pb-3 border-b border-gray-100 flex items-center justify-between">
                            <span>Price Details</span>
                            <span className="text-xs font-semibold text-gray-500">
                                {totalItems} {totalItems === 1 ? "Item" : "Items"}
                            </span>
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Total MRP / Subtotal</span>
                                <span className="font-semibold text-gray-900">₹{subtotal}</span>
                            </div>

                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Charges</span>
                                <span className="font-semibold">
                                    {deliveryCharges === 0 ? (
                                        <span className="text-green-600 font-bold">FREE</span>
                                    ) : (
                                        <span className="text-gray-900">₹{deliveryCharges}</span>
                                    )}
                                </span>
                            </div>

                            {deliveryCharges > 0 && (
                                <p className="text-[11px] text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100">
                                    Tip: Add items worth <strong>₹{500 - subtotal}</strong> more to qualify for <strong>FREE Delivery</strong>!
                                </p>
                            )}

                            {discount > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount ({appliedPromo})</span>
                                    <span>- ₹{discount}</span>
                                </div>
                            )}

                            {/* Promo Code Box */}
                            <div className="pt-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoInput}
                                        onChange={(e) => setPromoInput(e.target.value)}
                                        placeholder="Promo code (e.g. STUDENT10)"
                                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold uppercase outline-none focus:bg-white focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPromo()}
                                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {!appliedPromo && (
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPromo("STUDENT10")}
                                        className="mt-1.5 text-[11px] font-semibold text-blue-600 hover:underline"
                                    >
                                        Tap to apply 10% student offer: STUDENT10
                                    </button>
                                )}
                                {promoFeedback && (
                                    <p className={`mt-1 text-[11px] font-semibold ${appliedPromo ? "text-green-600" : "text-rose-500"}`}>
                                        {promoFeedback}
                                    </p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-base font-extrabold text-gray-900">
                                <span>Total Payable</span>
                                <span className="text-2xl text-blue-600 font-black">₹{finalTotal}</span>
                            </div>
                        </div>

                        {/* Order Placement Step 4 CTA in Sidebar */}
                        <div className="pt-2">
                            {currentStep === 1 && (
                                <button
                                    onClick={() => selectedAddressId && setCurrentStep(2)}
                                    disabled={!selectedAddressId}
                                    className="w-full bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition shadow-md disabled:opacity-50"
                                >
                                    Proceed to Summary →
                                </button>
                            )}
                            {currentStep === 2 && (
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="w-full bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition shadow-md"
                                >
                                    Proceed to Payment →
                                </button>
                            )}
                            {currentStep === 3 && (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacingOrder}
                                    className="w-full bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPlacingOrder ? "Placing Order..." : "Place Order (COD)"}
                                </button>
                            )}
                        </div>

                        <div className="text-[11px] text-gray-400 text-center space-y-1 pt-1">
                            <p>🔒 100% Safe and Secure Checkout</p>
                            <p>Cash on Delivery verified by StudentMart</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

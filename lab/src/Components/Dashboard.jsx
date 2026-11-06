import { useState } from "react";
import Profile from "./Profile";
import Products from "./Products";

function Dashboard({ user, onLogout, setUser }) {
    const [activeTab, setActiveTab] = useState("home");
    const [cart, setCart] = useState([]); // Cart state is safely stored here

    const NavItem = ({ tabId, label, svgPath, isRed, badge }) => {
        const isActive = activeTab === tabId;
        return (
            <div
                onClick={() => tabId === "logout" ? onLogout() : setActiveTab(tabId)}
                className={`flex items-center justify-between px-4 py-3 mb-1 rounded-xl cursor-pointer transition-all ${
                    isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : isRed
                        ? "text-red-500 hover:bg-red-50"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
            >
                <div className="flex items-center gap-4">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {svgPath}
                    </svg>
                    <span className="font-semibold text-sm">{label}</span>
                </div>
                
                {badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        {badge}
                    </span>
                )}
            </div>
        );
    };

    // Crash protection: ensure user exists before trying to read properties
    const safeName = user?.name || "Student";
    const safeUsn = user?.usn || safeName;
    const safeInitial = safeName.charAt(0).toUpperCase();

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 to-gray-100 overflow-hidden font-sans">
            
            {/* --- SIDEBAR --- */}
            <aside className="w-64 bg-white shadow-2xl flex flex-col flex-shrink-0 z-20">
                <div className="bg-blue-600 pt-10 pb-12 flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-white mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    <h2 className="text-2xl font-extrabold text-white tracking-wide">StudentMart</h2>
                    <p className="text-blue-100 text-xs mt-1 text-center px-4">Student Management<br/>System</p>
                </div>

                <div className="flex-1 bg-white rounded-t-3xl -mt-6 p-4 flex flex-col justify-between relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="space-y-1 mt-2 overflow-y-auto">
                        <NavItem tabId="home" label="Dashboard" svgPath={<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />
                        <NavItem tabId="profile" label="Profile" svgPath={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />
                        
                        <div className="border-t border-gray-100 my-2 pt-2"></div>
                        
                        <NavItem tabId="products" label="Store" svgPath={<><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>} />
                        <NavItem tabId="cart" label="My Cart" badge={cart.length} svgPath={<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>} />
                        <NavItem tabId="orders" label="My Orders" svgPath={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>} />
                        <NavItem tabId="add-product" label="Add Product" svgPath={<><path d="M12 5v14M5 12h14"/></>} />
                    </div>

                    <div className="border-t border-gray-100 pt-4 mb-2">
                        <NavItem tabId="logout" label="Logout" isRed={true} svgPath={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-5xl mx-auto">
                    
                    {activeTab === "profile" && (
                        <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                            <Profile user={user} onLogout={onLogout} setUser={setUser} />
                        </div>
                    )}

                    <div className={["products", "cart", "add-product", "orders"].includes(activeTab) ? "block" : "hidden"}>
                        <Products 
                            user={user} 
                            currentTab={activeTab} 
                            setActiveTab={setActiveTab} 
                            cart={cart} 
                            setCart={setCart} 
                        />
                    </div>

                    {activeTab === "home" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
                                <div>
                                    <span style={{ color: "#2563eb", fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>STUDENT DASHBOARD</span>
                                    <h1 style={{ margin: "10px 0", fontSize: "32px", color: "#111827" }}>Welcome back!</h1>
                                    <p style={{ color: "#6b7280", margin: 0 }}>Manage your student account from one place.</p>
                                </div>
                                <div onClick={() => setActiveTab("profile")} style={{ backgroundColor: "#fff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer", border: "1px solid #f3f4f6" }}>
                                    <div style={{ backgroundColor: "#2563eb", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>
                                        {safeInitial}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{safeUsn}</div>
                                        <div style={{ color: "#2563eb", fontSize: "12px", fontWeight: "500" }}>Edit Profile</div>
                                    </div>
                                    <span style={{ color: "#9ca3af", marginLeft: "10px" }}>→</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 50%", backgroundColor: "#f0f5ff", borderRadius: "20px", padding: "40px", minWidth: "300px" }}>
                                    <span style={{ color: "#2563eb", fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>STUDENTMART</span>
                                    <h2 style={{ marginTop: "15px", fontSize: "24px", color: "#111827" }}>Your student account</h2>
                                    <p style={{ color: "#6b7280", lineHeight: "1.6", marginTop: "15px", marginBottom: "30px", maxWidth: "85%" }}>
                                        Your profile is successfully connected to StudentMart. You can manage your account information from the profile section.
                                    </p>
                                    <button onClick={() => setActiveTab("products")} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                                        View Products
                                    </button>
                                </div>
                                <div style={{ flex: "1 1 30%", display: "flex", flexDirection: "column", gap: "15px", minWidth: "250px" }}>
                                    <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                                        <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>USN</div>
                                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{safeUsn}</div>
                                    </div>
                                    <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                                        <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>EMAIL</div>
                                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{user?.email || "No email"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
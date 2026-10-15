import { useState } from "react";
import Profile from "./Profile";

function Dashboard({ user, onLogout, setUser }) {
    const [activeTab, setActiveTab] = useState("home");

    return (
        <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            
            {/* --- TOP NAVIGATION BAR --- */}
            <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 40px", backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ backgroundColor: "#2563eb", color: "#fff", fontSize: "20px", fontWeight: "bold", width: "40px", height: "40px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        S
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>StudentMart</h2>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>Student Portal</span>
                    </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                    <span onClick={() => setActiveTab("home")} style={{ color: activeTab === "home" ? "#2563eb" : "#6b7280", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>Dashboard</span>
                    <span onClick={() => setActiveTab("profile")} style={{ color: activeTab === "profile" ? "#2563eb" : "#6b7280", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>Profile</span>
                    <button onClick={onLogout} style={{ border: "1px solid #d1d5db", backgroundColor: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", color: "#111827" }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* --- MAIN CONTENT AREA --- */}
            <div style={{ padding: "40px", maxWidth: "1100px", margin: "0 auto" }}>
                
                {activeTab === "profile" ? (
                    <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <Profile user={user} onLogout={onLogout} setUser={setUser} />
                    </div>
                ) : (
                    <div>
                        {/* Header Section */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
                            <div>
                                <span style={{ color: "#2563eb", fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>STUDENT DASHBOARD</span>
                                <h1 style={{ margin: "10px 0", fontSize: "32px", color: "#111827" }}>Welcome back!</h1>
                                <p style={{ color: "#6b7280", margin: 0 }}>Manage your student account from one place.</p>
                            </div>

                            {/* Top Right Quick Edit Card */}
                            <div onClick={() => setActiveTab("profile")} style={{ backgroundColor: "#fff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer", border: "1px solid #f3f4f6" }}>
                                <div style={{ backgroundColor: "#2563eb", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>
                                    1
                                </div>
                                <div>
                                    <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{user.usn || user.name}</div>
                                    <div style={{ color: "#2563eb", fontSize: "12px", fontWeight: "500" }}>Edit Profile</div>
                                </div>
                                <span style={{ color: "#9ca3af", marginLeft: "10px" }}>→</span>
                            </div>
                        </div>

                        {/* Grid Layout */}
                        <div style={{ display: "flex", gap: "20px" }}>
                            
                            {/* Left Large Card */}
                            <div style={{ flex: 1.5, backgroundColor: "#f0f5ff", borderRadius: "20px", padding: "40px" }}>
                                <span style={{ color: "#2563eb", fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>STUDENTMART</span>
                                <h2 style={{ marginTop: "15px", fontSize: "24px", color: "#111827" }}>Your student account</h2>
                                <p style={{ color: "#6b7280", lineHeight: "1.6", marginTop: "15px", marginBottom: "30px", maxWidth: "85%" }}>
                                    Your profile is successfully connected to StudentMart. You can manage your account information from the profile section.
                                </p>
                                <button onClick={() => setActiveTab("profile")} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                                    Edit Profile
                                </button>
                            </div>

                            {/* Right Column Smaller Cards */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "15px" }}>
                                
                                <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                                    <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>USN</div>
                                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{user.usn || user.name}</div>
                                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>Student identification number</div>
                                </div>

                                <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                                    <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>EMAIL</div>
                                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{user.email}</div>
                                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>Registered email address</div>
                                </div>

                                <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                                    <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>ACCOUNT</div>
                                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>Active</div>
                                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>Your account is active</div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
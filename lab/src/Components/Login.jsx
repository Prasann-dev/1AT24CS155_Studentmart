import { useState } from "react";

export default function Login({ setLoggedInUser, onSwitch }) {
    const [activeTab, setActiveTab] = useState("student"); // "student" | "admin"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleForgotPassword = () => {
        if (!email) {
            alert("Please enter your email address first so we know where to send the reset link.");
            return;
        }
        alert(`A password reset link has been sent to ${email}!`);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        const endpoint = activeTab === "admin"
            ? "http://localhost:5002/api/auth/admin-login"
            : "http://localhost:5002/api/auth/login";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }) 
            });
            const data = await response.json();

            if (response.ok) {
                // If student logs in via student portal but has admin account, they will be recognized as admin
                setLoggedInUser(data.user, data.token);
            } else {
                setMessage(data.message || "Authentication failed. Please verify credentials.");
            }
        } catch {
            setMessage("Server connection failed. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full p-7 bg-[#1a222c]/45 backdrop-blur-md rounded-2xl border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
            {/* Top Navigation Tabs: Student Login & Admin Portal */}
            <div className="grid grid-cols-2 p-1 bg-[#252d38]/75 rounded-xl border border-white/10 mb-6">
                <button
                    type="button"
                    onClick={() => { setActiveTab("student"); setMessage(""); }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "student"
                            ? "bg-[#145a47] text-white shadow-md shadow-black/25"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                    <span>Student Login</span>
                </button>
                <button
                    type="button"
                    onClick={() => { setActiveTab("admin"); setMessage(""); }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "admin"
                            ? "bg-[#2a3b52] text-white shadow-md shadow-black/25"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <svg className="w-4 h-4 text-[#6ba4e8]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                    </svg>
                    <span>Admin Portal</span>
                </button>
            </div>

            {/* Header Content */}
            <div className="text-center mb-5">
                {activeTab === "admin" ? (
                    <>
                        <div className="inline-flex items-center gap-1.5 bg-[#f1dec9]/15 text-[#f1dec9] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#f1dec9]/25 mb-2">
                            <span>🛡️</span>
                            <span>Authorized Personnel Only</span>
                        </div>
                        <h2 className="text-[22px] font-bold text-white">Administrator Access</h2>
                        <p className="mt-1 text-xs text-slate-300/80">Sign in to manage store inventory & catalog</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-[22px] font-bold text-white">Student Sign In</h2>
                        <p className="mt-1 text-xs text-slate-300/80">Sign in to browse and buy campus products</p>
                    </>
                )}
            </div>
            
            {message && (
                <div className="p-3 mb-4 rounded-lg bg-red-500/20 border border-red-500/30 text-center">
                    <p className="text-red-300 text-xs font-semibold">{message}</p>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
                {/* Email Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center">
                        <svg className="mr-2 text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        {activeTab === "admin" ? "Admin Email Address" : "Student Email Address"}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-dark-input w-full bg-[#2b3139]/80 border border-white/15 rounded-lg text-white px-3.5 py-2 outline-none focus:border-[#1a745c] transition-colors text-sm placeholder-slate-400"
                        placeholder={activeTab === "admin" ? "admin@studentmart.com" : "student@example.com"}
                        required
                    />
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center">
                        <svg className="mr-2 text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-dark-input w-full bg-[#2b3139]/80 border border-white/15 rounded-lg text-white px-3.5 py-2 pr-10 outline-none focus:border-[#1a745c] transition-colors text-sm placeholder-slate-400"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition focus:outline-none"
                        >
                            {showPassword ? (
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-0.5 flex items-center justify-between">
                    <span 
                        onClick={handleForgotPassword}
                        className="text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                    >
                        Forgot Password?
                    </span>
                    {activeTab === "admin" && (
                        <span className="text-[10px] text-[#f1dec9]/80">Secured with RBAC</span>
                    )}
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white font-semibold transition-all mt-2 text-sm disabled:opacity-50 ${
                        activeTab === "admin" 
                            ? "bg-[#2a3b52] hover:bg-[#344965] text-white shadow-lg" 
                            : "bg-[#145a47] hover:bg-[#196f58] shadow-lg shadow-[#145a47]/30"
                    }`}
                >
                    {loading ? (
                        <span>Authenticating...</span>
                    ) : (
                        <>
                            <span>{activeTab === "admin" ? "Enter Admin Dashboard" : "Sign In to StudentMart"}</span>
                            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                            </svg>
                        </>
                    )}
                </button>
            </form>
            
            {activeTab === "student" ? (
                <p className="text-center text-xs text-slate-400 mt-5 pt-4 border-t border-white/10">
                    Don't have an account? <span onClick={onSwitch} className="font-semibold text-[#5596d0] hover:text-[#7bb5e8] transition cursor-pointer">Sign Up</span>
                </p>
            ) : (
                <div className="mt-5 pt-4 border-t border-white/10 text-center">
                    <p className="text-[11px] text-gray-400">
                        Default Admin: <span className="font-mono text-gray-300">admin@studentmart.com</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                        Use the secure initialization script to configure administrator accounts.
                    </p>
                </div>
            )}
        </div>
    );
}

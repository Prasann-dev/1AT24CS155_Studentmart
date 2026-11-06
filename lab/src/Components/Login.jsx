import { useState } from "react";

export default function Login({ setLoggedInUser, onSwitch }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    
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
        try {
            const response = await fetch("http://localhost:5002/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // MAKE SURE THESE MATCH EXACTLY:
                body: JSON.stringify({ email, password }) 
            });
            const data = await response.json();

            if (response.ok) {
                setLoggedInUser(data.user);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Server connection failed");
        }
    };
    return (
        <div className="w-full p-8 space-y-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="mt-1 text-xs text-gray-300">Sign in to continue</p>
            </div>
            
            {message && <p className="text-center text-red-400 text-xs font-semibold">{message}</p>}

            <form className="space-y-5" onSubmit={handleLogin}>
                
                {/* Email Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center">
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border-b-2 border-gray-400/50 text-white px-3 py-1.5 outline-none focus:border-blue-500 transition-colors text-sm"
                        placeholder="name@example.com"
                        required
                    />
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center">
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border-b-2 border-gray-400/50 text-white px-3 py-1.5 pr-10 outline-none focus:border-blue-500 transition-colors text-sm"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition focus:outline-none"
                        >
                            {/* SWAPPED ICONS HERE */}
                            {showPassword ? (
                                /* OPEN EYE (When password is visible) */
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                /* CROSSED EYE (When password is hidden) */
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-1">
                    <span 
                        onClick={handleForgotPassword}
                        className="text-[11px] text-gray-400 hover:text-white transition cursor-pointer"
                    >
                        Forgot Password?
                    </span>
                </div>
                
                <button
                    type="submit"
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-all mt-2 text-sm"
                >
                    Sign In
                    <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </form>
            
            <p className="text-center text-xs text-gray-400 mt-4 pt-4 border-t border-white/10">
                Don't have an account? <span onClick={onSwitch} className="font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer">Sign Up</span>
            </p>
        </div>
    );
}
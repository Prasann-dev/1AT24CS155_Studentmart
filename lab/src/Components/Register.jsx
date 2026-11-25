import { useState } from "react";

export default function Register({ onSwitch }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5002/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            setIsSuccess(response.ok);
            setMessage(data.message || "Registration successful!");
            
            if (response.ok) {
                setTimeout(() => onSwitch(), 1500); 
            }
        } catch {
            setIsSuccess(false);
            setMessage("Server connection failed");
        }
    };

    return (
        <div className="w-full p-7 space-y-5 bg-[#1a222c]/45 backdrop-blur-md rounded-2xl border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <p className="mt-1 text-xs text-gray-300">Join StudentMart today</p>
            </div>
            
            {message && <p className={`text-center text-xs font-semibold ${isSuccess ? "text-green-400" : "text-red-400"}`}>{message}</p>}

            <form className="space-y-4" onSubmit={handleRegister}>
                
                {/* Name Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center">
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="auth-dark-input w-full bg-[#2b3139]/80 border border-white/15 rounded-lg text-white px-3.5 py-2 outline-none focus:border-[#1a745c] transition-colors text-sm placeholder-slate-400"
                        placeholder="e.g. John Doe"
                        required
                    />
                </div>

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
                        className="auth-dark-input w-full bg-[#2b3139]/80 border border-white/15 rounded-lg text-white px-3.5 py-2 outline-none focus:border-[#1a745c] transition-colors text-sm placeholder-slate-400"
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
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-dark-input w-full bg-[#2b3139]/80 border border-white/15 rounded-lg text-white px-3.5 py-2 outline-none focus:border-[#1a745c] transition-colors text-sm placeholder-slate-400"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-[#145a47] hover:bg-[#196f58] rounded-lg text-white font-semibold transition-all mt-4 text-sm shadow-lg shadow-[#145a47]/30"
                >
                    Sign Up
                    <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </form>
            
            <p className="text-center text-xs text-slate-400 mt-4 pt-4 border-t border-white/10">
                Already have an account? <span onClick={onSwitch} className="font-semibold text-[#5596d0] hover:text-[#7bb5e8] transition cursor-pointer">Log In</span>
            </p>
        </div>
    );
}
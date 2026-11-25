import { useState } from "react";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import AdminDashboard from "./Components/AdminDashboard";
import loginBg from "./assets/login-bg.jpg";

function App() {
    // 1. Safely load user & token from localStorage on startup
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            if (!savedUser) return null;
            const parsed = JSON.parse(savedUser);
            return (parsed && (parsed.id || parsed._id || parsed.email)) ? parsed : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || "";
    });

    const [showLogin, setShowLogin] = useState(true);

    // 2. Helper to sync React state AND localStorage seamlessly
    const handleSetUser = (userData, userToken = null) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            if (userToken) {
                setToken(userToken);
                localStorage.setItem("token", userToken);
            }
        } else {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setToken("");
        }
    };

    const handleLogout = () => {
        handleSetUser(null);
    };

    // If user is authenticated, route to the respective dashboard
    if (user) {
        return user.role === "admin" ? (
            <AdminDashboard user={user} token={token} onLogout={handleLogout} />
        ) : (
            <Dashboard user={user} token={token} onLogout={handleLogout} setUser={handleSetUser} />
        );
    }

    // Unauthenticated: Show Dual-Portal Login / Register
    return (
        <div className="fixed inset-0 w-screen h-screen m-0 p-0 overflow-y-auto overflow-x-hidden bg-[#0e151f]">
            {/* 3D Campus Storefront Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{ backgroundImage: `url(${loginBg})` }}
            />
            <div className="fixed inset-0 bg-[#0b111a]/55 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-4">
                {/* StudentMart Logo and Title */}
                <div className="text-center mb-5 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2.5">
                        <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4L2 9l10 5 10-5-10-5z" fill="#4b5563" stroke="#9ca3af" strokeWidth="1.2" strokeLinejoin="round" />
                            <path d="M6 11.5v4.5c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2v-4.5l-6 3-6-3z" fill="#374151" stroke="#6b7280" strokeWidth="1.2" strokeLinejoin="round" />
                            <path d="M19 10.5v5.5" stroke="#e9b872" strokeWidth="1.6" strokeLinecap="round" />
                            <circle cx="19" cy="16.5" r="1.1" fill="#e9b872" />
                        </svg>
                        <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-sm">StudentMart</h1>
                    </div>
                    <p className="text-[#6b8fb5] text-xs sm:text-sm mt-1.5 font-medium">Your campus, connected.</p>
                </div>

                {/* Login / Register Box */}
                <div className="w-full max-w-[395px]">
                    {showLogin ? (
                        <Login setLoggedInUser={handleSetUser} onSwitch={() => setShowLogin(false)} />
                    ) : (
                        <Register onSwitch={() => setShowLogin(true)} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;

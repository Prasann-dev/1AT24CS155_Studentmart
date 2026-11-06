import { useState } from "react";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";

function App() {
    // 1. Safely load user from localStorage on startup
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            if (!savedUser) return null;
            const parsed = JSON.parse(savedUser);
            return (parsed && (parsed.id || parsed._id || parsed.email)) ? parsed : null;
        } catch (error) {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [showLogin, setShowLogin] = useState(true);

    // 2. Helper to sync both React state AND localStorage seamlessly
    const handleSetUser = (userData) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
        } else {
            localStorage.removeItem("user");
        }
    };

    const handleLogout = () => {
        handleSetUser(null);
    };

    return (
        <div className="fixed inset-0 w-screen h-screen m-0 p-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-black">
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} setUser={handleSetUser} />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-full p-4">
                    
                    {/* StudentMart Logo and Title */}
                    <div className="text-center mb-6 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-3">
                            {/* Graduation Cap Logo */}
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30">
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                                </svg>
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-wider">StudentMart</h1>
                        </div>
                        <p className="text-blue-400 text-sm mt-2">Your campus, connected.</p>
                    </div>

                    {/* The Login / Register Box */}
                    <div className="w-full max-w-md">
                        {showLogin ? (
                            <Login setLoggedInUser={handleSetUser} onSwitch={() => setShowLogin(false)} />
                        ) : (
                            <Register onSwitch={() => setShowLogin(true)} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
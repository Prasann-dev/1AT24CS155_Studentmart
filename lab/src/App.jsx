import { useState } from "react";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import "./Components/Auth.css";

function App() {
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(true); // Toggles forms

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div style={{ margin: 0, padding: 0 }}>
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} setUser={setUser} />
            ) : (
                <div className="auth-wrapper">
                    {/* Header Logo */}
                    <div className="auth-header">
                        <div className="auth-logo-container">
                            <div className="auth-logo">S</div>
                            <div className="auth-brand-text">
                                <h1>StudentMart</h1>
                                <p>Your campus, connected.</p>
                            </div>
                        </div>
                    </div>

                    {/* Toggle between Login and Register */}
                    {showLogin ? (
                        <Login setLoggedInUser={setUser} onSwitch={() => setShowLogin(false)} />
                    ) : (
                        <Register onSwitch={() => setShowLogin(true)} />
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
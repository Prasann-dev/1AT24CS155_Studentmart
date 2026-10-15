import { useState } from "react";
import "./Auth.css";

function Login({ setLoggedInUser, onSwitch }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5002/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                setLoggedInUser(data.user);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Something went wrong");
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-icon-top">🔒</div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Log in to your StudentMart account.</p>

            <form className="auth-form" onSubmit={handleLogin}>
                <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-icon-wrapper">
                        <span className="input-icon">✉️</span>
                        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                    </div>
                </div>
                
                <div className="input-group">
                    <label>Password</label>
                    <div className="input-icon-wrapper">
                        <span className="input-icon">🔑</span>
                        <input className="auth-input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                        <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "👁️‍🗨️" : "👁️"}
                        </span>
                    </div>
                </div>

                <div className="auth-options">
                    <label className="remember-me">
                        <input type="checkbox" /> Remember me
                    </label>
                    <span className="forgot-link">Forgot Password?</span>
                </div>

                <button className="auth-button" type="submit">Log In</button>
            </form>
            
            {message && <p className="auth-message">{message}</p>}

            <div className="auth-footer">
                Don't have an account? <span onClick={onSwitch}>Sign Up</span>
            </div>
        </div>
    );
}

export default Login;
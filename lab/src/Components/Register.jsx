import { useState } from "react";
import "./Auth.css";

function Register({ onSwitch }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // Password validation logic
    const hasMinLength = password.length >= 6;
    const hasLettersAndNumbers = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    const passwordsMatch = password === confirmPassword && password !== "";

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!hasMinLength || !hasLettersAndNumbers || !passwordsMatch) {
            setMessage("Please fulfill all password requirements.");
            return;
        }

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
                setTimeout(() => onSwitch(), 2000); // Switch to login after 2 seconds
            }
        } catch (error) {
            setIsSuccess(false);
            setMessage("Something went wrong");
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-icon-top">👤</div>
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">Join StudentMart today.</p>

            <form className="auth-form" onSubmit={handleRegister}>
                <div className="input-group">
                    <label>Full Name</label>
                    <div className="input-icon-wrapper">
                        <span className="input-icon">👤</span>
                        <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" required />
                    </div>
                </div>

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
                        <input className="auth-input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
                        <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "👁️‍🗨️" : "👁️"}
                        </span>
                    </div>
                </div>

                <div className="input-group">
                    <label>Confirm Password</label>
                    <div className="input-icon-wrapper">
                        <span className="input-icon">🔑</span>
                        <input className="auth-input" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
                        <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                        </span>
                    </div>
                </div>

                <div className="password-reqs">
                    <div className={`req-item ${hasMinLength ? "req-met" : ""}`}>
                        {hasMinLength ? "✅" : "✔️"} At least 6 characters
                    </div>
                    <div className={`req-item ${hasLettersAndNumbers ? "req-met" : ""}`}>
                        {hasLettersAndNumbers ? "✅" : "✔️"} Use a mix of letters and numbers
                    </div>
                    <div className={`req-item ${passwordsMatch ? "req-met" : ""}`}>
                        {passwordsMatch ? "✅" : "✔️"} Passwords must match
                    </div>
                </div>

                <button className="auth-button" type="submit">Sign Up</button>
            </form>
            
            {message && <p className={`auth-message ${isSuccess ? "success-message" : ""}`}>{message}</p>}

            <div className="auth-footer">
                Already have an account? <span onClick={onSwitch}>Log In</span>
            </div>
        </div>
    );
}

export default Register;
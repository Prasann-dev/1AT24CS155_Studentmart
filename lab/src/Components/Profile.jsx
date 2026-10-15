import { useState } from "react";
import "./Dashboard.css"; 

function Profile({ user, onLogout, setUser }) {
    const [isEditing, setIsEditing] = useState(false);
    
    const [editName, setEditName] = useState(user.name || "");
    const [editEmail, setEditEmail] = useState(user.email || "");
    const [editUsn, setEditUsn] = useState(user.usn || "");
    const [editPhone, setEditPhone] = useState(user.phone || "");
    const [newPassword, setNewPassword] = useState(""); 
    
    const [message, setMessage] = useState("");

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5002/api/auth/update/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name: editName, 
                    email: editEmail, 
                    usn: editUsn, 
                    phone: editPhone,
                    password: newPassword 
                })
            });
            const data = await response.json();

            if (response.ok) {
                setMessage("Profile updated successfully!");
                setIsEditing(false);
                setNewPassword(""); 
                setUser(data.user); 
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Something went wrong");
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#111827" }}>User Profile</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-primary">
                        Edit Profile
                    </button>
                )}
            </div>

            {message && <p style={{ color: "#10b981", fontWeight: "600", marginBottom: "15px" }}>{message}</p>}

            {!isEditing ? (
                // --- VIEW MODE ---
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                        <strong style={{ color: "#374151" }}>Name:</strong> <span style={{ color: "#111827", marginLeft: "8px" }}>{user.name}</span>
                    </div>
                    <div style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                        <strong style={{ color: "#374151" }}>USN:</strong> <span style={{ color: "#111827", marginLeft: "8px" }}>{user.usn || "Not provided"}</span>
                    </div>
                    <div style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                        <strong style={{ color: "#374151" }}>Email:</strong> <span style={{ color: "#111827", marginLeft: "8px" }}>{user.email}</span>
                    </div>
                    <div style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                        <strong style={{ color: "#374151" }}>Phone Number:</strong> <span style={{ color: "#111827", marginLeft: "8px" }}>{user.phone || "Not provided"}</span>
                    </div>
                    <div style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                        <strong style={{ color: "#374151" }}>Password:</strong> <span style={{ color: "#111827", marginLeft: "8px" }}>••••••••</span>
                    </div>
                </div>
            ) : (
                // --- EDIT MODE ---
                <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Name</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>USN</label>
                        <input type="text" value={editUsn} onChange={(e) => setEditUsn(e.target.value)} placeholder="e.g. 1AT24CS155" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Email Address</label>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Phone Number</label>
                        <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="e.g. +1 234 567 8900" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>New Password <span style={{ color: "#9ca3af", fontWeight: "normal" }}>(Leave blank to keep current)</span></label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="submit" className="btn-primary" style={{ padding: "12px 24px" }}>Save Changes</button>
                        <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", backgroundColor: "#fff", fontWeight: "600", color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default Profile;
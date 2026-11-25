import { useState } from "react";

export default function Settings({
    user,
    preferences,
    onUpdatePreferences,
    setActiveTab,
    onActivityLog
}) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPwd, setSavingPwd] = useState(false);
    const [pwdFeedback, setPwdFeedback] = useState(null);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPwdFeedback(null);

        if (newPassword.length < 6) {
            setPwdFeedback({ type: "error", text: "Password must be at least 6 characters long." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdFeedback({ type: "error", text: "Passwords do not match." });
            return;
        }

        const userId = user?._id || user?.id;
        if (!userId) {
            setPwdFeedback({ type: "error", text: "User ID missing. Please log in again." });
            return;
        }

        setSavingPwd(true);
        try {
            const res = await fetch(`http://localhost:5002/api/auth/update/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    usn: user.usn,
                    phone: user.phone,
                    imageUrl: user.imageUrl,
                    password: newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                setPwdFeedback({ type: "success", text: "Password updated successfully!" });
                setNewPassword("");
                setConfirmPassword("");
                if (onActivityLog) onActivityLog("Account Password Updated");
            } else {
                setPwdFeedback({ type: "error", text: data.message || "Failed to update password." });
            }
        } catch {
            setPwdFeedback({ type: "error", text: "Could not connect to server." });
        } finally {
            setSavingPwd(false);
        }
    };

    const togglePref = (key) => {
        onUpdatePreferences({
            ...preferences,
            [key]: !preferences[key]
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#131b26]">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage your notification preferences, security, and student account options.
                    </p>
                </div>
                <button
                    onClick={() => setActiveTab("profile")}
                    className="bg-[#f6f1ea] hover:bg-[#ebe2d5] text-[#131b26] border border-[#e3d9cb] font-bold px-4 py-2 rounded-xl text-xs transition self-start sm:self-auto"
                >
                    Edit Profile Details →
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preferences Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                    <h2 className="text-lg font-bold text-slate-900">Notification & Store Preferences</h2>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                            <div>
                                <p className="font-bold text-sm text-slate-900">Order Status Notifications</p>
                                <p className="text-xs text-slate-500">Show shipment & delivery updates in top bell menu.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.orderAlerts}
                                onChange={() => togglePref("orderAlerts")}
                                className="w-4 h-4 accent-blue-600"
                            />
                        </label>

                        <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                            <div>
                                <p className="font-bold text-sm text-slate-900">Promotional Deals & Coupons</p>
                                <p className="text-xs text-slate-500">Highlight student promo codes like STUDENT10 on dashboard.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.promoAlerts}
                                onChange={() => togglePref("promoAlerts")}
                                className="w-4 h-4 accent-blue-600"
                            />
                        </label>

                        <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                            <div>
                                <p className="font-bold text-sm text-slate-900">Auto-apply STUDENT10 at Checkout</p>
                                <p className="text-xs text-slate-500">Automatically pre-fill the 10% student discount code.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.autoApplyPromo}
                                onChange={() => togglePref("autoApplyPromo")}
                                className="w-4 h-4 accent-blue-600"
                            />
                        </label>
                    </div>
                </div>

                {/* Security / Change Password */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Account Security</h2>

                    {pwdFeedback && (
                        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold border ${
                            pwdFeedback.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                            {pwdFeedback.text}
                        </div>
                    )}

                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 6 characters"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingPwd}
                            className="bg-[#1d5e4b] hover:bg-[#174c3c] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-xs disabled:opacity-50"
                        >
                            {savingPwd ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

import { useState, useRef, useEffect } from "react";

export default function Profile({ user, setUser }) {
    const [isEditing, setIsEditing] = useState(false);
    
    // Uses the image from the user prop, or localStorage, or a default placeholder
    const [profileImage, setProfileImage] = useState(() => {
        return user?.imageUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80";
    });
    
    const [formData, setFormData] = useState({
        name: user?.name || "",
        usn: user?.usn || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: "••••••••"
    });

    // SYNC: Whenever the `user` prop updates (like when switching back to this tab), update the form & image
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                usn: user.usn || "",
                email: user.email || "",
                phone: user.phone || "",
                password: "••••••••"
            });
            if (user.imageUrl) {
                setProfileImage(user.imageUrl);
            }
        }
    }, [user]);

    const fileInputRef = useRef(null);

    // Converts the image into a permanent Base64 string that MongoDB can save
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const userId = user._id || user.id; 
        
        if (!userId) {
            alert("Error: Could not find User ID. Please log out and log back in.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5002/api/auth/update/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, imageUrl: profileImage })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Handle different backend response structures smoothly
                const updatedUser = data.user || data; 
                
                // 1. Update React state in the parent component
                if (setUser) setUser(updatedUser); 
                
                // 2. SAVE TO LOCALSTORAGE so switching tabs won't erase it!
                localStorage.setItem("user", JSON.stringify(updatedUser));
                
                setIsEditing(false);
                alert("Profile and Image permanently saved!");
            } else {
                const errorData = await response.json();
                alert(`Failed to save: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Could not connect to server.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl w-full max-w-4xl mx-auto shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-50 font-sans relative">
            
            {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute top-8 right-8 p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition"
                    title="Edit Profile"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            )}

            <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                
                {/* LEFT SIDE: Avatar & Image Upload */}
                <div className="relative group shrink-0">
                    <div className="w-48 h-48 rounded-full p-2 bg-gradient-to-br from-blue-100 to-indigo-100">
                        <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full border-4 border-white shadow-sm"
                        />
                    </div>
                    
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="absolute bottom-2 right-2 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition hover:scale-105"
                        title="Change Profile Picture"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>

                {/* RIGHT SIDE: Profile Details */}
                <div className="flex-1 w-full pt-4">
                    
                    {!isEditing ? (
                        <>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-8">{formData.name || "Student Name"}</h2>
                            
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 text-gray-700">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h3" /></svg>
                                    <span className="font-semibold text-gray-900 w-24">USN :</span>
                                    <span>{formData.usn || "Not set"}</span>
                                </div>
                                
                                <div className="flex items-center gap-4 text-gray-700">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="font-semibold text-gray-900 w-24">E-mail :</span>
                                    <span>{formData.email}</span>
                                </div>

                                <div className="flex items-center gap-4 text-gray-700">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span className="font-semibold text-gray-900 w-24">Phone :</span>
                                    <span>{formData.phone || "Not set"}</span>
                                </div>

                                <div className="flex items-center gap-4 text-gray-700">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <span className="font-semibold text-gray-900 w-24">Password :</span>
                                    <span className="font-mono">{formData.password}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-gray-50" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">USN</label>
                                    <input type="text" value={formData.usn} onChange={e => setFormData({...formData, usn: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-gray-50" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-gray-50" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
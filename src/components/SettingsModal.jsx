import { useState, useEffect } from 'react';
import { X, Lock, Activity, Heart, Image as ImageIcon, ExternalLink, Loader2, Mail, ShieldAlert, CheckCircle } from 'lucide-react';
import { db, auth } from '../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth'; 
import { isAdmin } from '../adminConfig'; // Import Admin check

const SettingsModal = ({ isOpen, onClose, currentUser, onPostClick }) => {
  const [activeTab, setActiveTab] = useState('activity');
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  
  // Admin & Delete Account State
  const [allowUserDelete, setAllowUserDelete] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const isSystemAdmin = isAdmin(currentUser);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (isOpen) {
        setActiveTab('activity');
        fetchLikedPosts();
        setResetMessage("");
        fetchGlobalSettings();
    }
  }, [isOpen]);

  const fetchGlobalSettings = async () => {
    const docRef = doc(db, "app_settings", "config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        setAllowUserDelete(docSnap.data().allowUserDelete);
    } else {
        await setDoc(docRef, { allowUserDelete: true });
    }
  };

  const fetchLikedPosts = async () => {
    setLoading(true);
    try {
        const q = query(
            collection(db, "notifications"),
            where("fromUser", "==", currentUser),
            where("type", "==", "like")
        );
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Deduplicate posts based on postId
        const uniquePostsMap = new Map();
        history.forEach(item => {
            if(item.postId) uniquePostsMap.set(item.postId, item);
        });
        
        const uniquePosts = Array.from(uniquePostsMap.values());
        uniquePosts.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        setLikedPosts(uniquePosts);
    } catch (error) {
        console.error("Error fetching likes:", error);
    }
    setLoading(false);
  };

  // --- HANDLERS ---

  const handlePasswordReset = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
        setResetMessage("Error: No email linked to this account.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        setResetMessage(`Reset link sent to ${auth.currentUser.email}`);
    } catch (error) {
        setResetMessage("Error sending email. Try again later.");
        console.error(error);
    }
  };

  const toggleDeletePermission = async () => {
    const newValue = !allowUserDelete;
    setAllowUserDelete(newValue);
    await setDoc(doc(db, "app_settings", "config"), { allowUserDelete: newValue }, { merge: true });
  };

  const handleDeleteMyAccount = async () => {
    if (!window.confirm("ARE YOU SURE? This cannot be undone. All your data will be lost.")) return;
    
    setLoadingDelete(true);
    try {
        // 1. Delete user doc from Firestore
        await deleteDoc(doc(db, "users", currentUser));
        
        // 2. Delete Authentication User
        const user = auth.currentUser;
        if (user) {
            await deleteUser(user);
            alert("Account deleted.");
            window.location.reload(); 
        }
    } catch (err) {
        console.error(err);
        alert("Error: Requires recent login. Please logout and login again, then try.");
    } finally {
        setLoadingDelete(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
            <h2 className="text-xl font-bold font-serif text-gray-800">Settings</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-600" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-50 mx-5 mt-5 rounded-2xl flex-shrink-0">
            <button 
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'activity' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Activity size={18} /> Activity
            </button>
            <button 
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'security' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Lock size={18} /> Security
            </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* --- ACTIVITY TAB --- */}
            {activeTab === 'activity' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Heart size={18} className="fill-red-500 text-red-500"/> Liked Posts
                        </h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{likedPosts.length}</span>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                             <Loader2 size={30} className="animate-spin mb-2 text-indigo-500" />
                             <p className="text-xs">Loading history...</p>
                        </div>
                    ) : likedPosts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {likedPosts.map((post) => (
                                <div 
                                    key={post.id} 
                                    onClick={() => { onClose(); if(onPostClick) onPostClick(post.postId); }}
                                    className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-300">
                                        {post.image ? <img src={post.image} alt="Post" className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-500 mb-0.5">@{post.toUser || "User"}</p>
                                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.contentSnippet || "Visual Content"}</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-300 group-hover:text-indigo-500 transition" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <Activity size={40} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">No likes yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- SECURITY TAB --- */}
            {activeTab === 'security' && (
                <div className="text-center space-y-6">
                    
                    {/* Email & Password Section */}
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail size={30} className="text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Email Authentication</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Logged in as: <span className="font-bold text-gray-700">{auth.currentUser?.email}</span>
                        </p>
                        
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-3">
                                Need to change your password?
                            </p>
                            <button 
                                onClick={handlePasswordReset}
                                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg w-full"
                            >
                                Send Reset Link
                            </button>
                            {resetMessage && (
                                <div className={`mt-3 text-xs font-medium px-3 py-2 rounded-lg ${resetMessage.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                                    {resetMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ADMIN CONTROLS (Only visible to Admin) */}
                    {isSystemAdmin && (
                        <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 text-left">
                            <h4 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                                <Lock size={16}/> Admin Controls
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-indigo-800 font-medium">Allow users to delete accounts?</span>
                                <button 
                                    onClick={toggleDeletePermission}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${allowUserDelete ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${allowUserDelete ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-indigo-600/70 mt-2">
                                {allowUserDelete ? "Users can currently delete their own accounts." : "Users are blocked from deleting accounts."}
                            </p>
                        </div>
                    )}

                    {/* DANGER ZONE (Delete Account) */}
                    <div className="pt-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Danger Zone</h4>
                        
                        {allowUserDelete || isSystemAdmin ? (
                            <button 
                                onClick={handleDeleteMyAccount} 
                                disabled={loadingDelete}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-bold hover:bg-red-100 transition"
                            >
                                <ShieldAlert size={18} />
                                {loadingDelete ? "Processing..." : "Delete My Account"}
                            </button>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 text-gray-500 p-3 rounded-xl text-center text-sm">
                                <Lock size={16} className="mx-auto mb-1 opacity-50"/>
                                Account deletion is temporarily disabled by Admin.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
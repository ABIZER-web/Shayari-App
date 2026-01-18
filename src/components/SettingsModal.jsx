import { useState, useEffect } from 'react';
import { X, Lock, Activity, Heart, Image as ImageIcon, ExternalLink, Loader2, Mail } from 'lucide-react';
import { db, auth } from '../firebase'; // Import auth
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth'; // Import reset function

const SettingsModal = ({ isOpen, onClose, currentUser, onPostClick }) => {
  const [activeTab, setActiveTab] = useState('activity');
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Reset tab when opening
  useEffect(() => {
    if (isOpen) {
        setActiveTab('activity');
        fetchLikedPosts();
        setResetMessage("");
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
        
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
            <h2 className="text-xl font-bold font-serif text-gray-800">Settings</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-600" />
            </button>
        </div>

        <div className="flex p-2 gap-2 bg-gray-50 mx-5 mt-5 rounded-2xl">
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

        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
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

            {activeTab === 'security' && (
                <div className="text-center py-6 space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail size={30} className="text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Email Authentication</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Logged in as: <span className="font-bold text-gray-700">{auth.currentUser?.email}</span>
                        </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-2">Change Password</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            We will send a link to your email address to reset your password.
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
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, increment, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { Heart, MessageCircle, Bookmark, Trash2, Share2, MoreHorizontal, Download, Phone, X } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';

const ShayariCard = ({ shayari, onProfileClick }) => {
  const [likes, setLikes] = useState(shayari.likes || 0);
  const [saveCount, setSaveCount] = useState(shayari.saveCount || 0); 
  
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [newComment, setNewComment] = useState("");
  
  // Likes Modal State
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likersList, setLikersList] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const shareMenuRef = useRef(null);

  const currentUser = localStorage.getItem('shayari_user');
  const isAdmin = currentUser === 'admin';
  const isAuthor = currentUser === shayari.author;
  const LIKE_KEY = `liked_${shayari.id}_${currentUser}`;
  const SAVE_STORAGE_KEY = `saved_posts_${currentUser}`;

  // --- SYNC DATA ON LOAD ---
  useEffect(() => { 
    setLikes(shayari.likes || 0); 
    setSaveCount(shayari.saveCount || 0); 
    
    // Check Like Status
    if (localStorage.getItem(LIKE_KEY)) setIsLiked(true);
    else setIsLiked(false);

    // Check Save Status
    const savedList = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) || '[]');
    if (savedList.find(item => item.id === shayari.id)) setIsSaved(true);
    else setIsSaved(false);

    // Real-time Comments Listener
    const q = query(collection(db, "shayaris", shayari.id, "comments"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
        setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Click Outside Share Menu
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        unsubscribe();
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [shayari.id, SAVE_STORAGE_KEY, LIKE_KEY]);

  // --- OPTIMIZED INSTANT SAVE ---
  const handleSave = async () => {
    const newIsSaved = !isSaved;
    const newSaveCount = newIsSaved ? saveCount + 1 : (saveCount > 0 ? saveCount - 1 : 0);

    setIsSaved(newIsSaved);
    setSaveCount(newSaveCount);

    const savedList = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) || '[]');
    let updatedList;
    
    if (newIsSaved) {
        updatedList = [...savedList, shayari];
    } else {
        updatedList = savedList.filter(item => item.id !== shayari.id);
    }
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('saved-posts-updated'));

    const docRef = doc(db, "shayaris", shayari.id);
    try {
        await updateDoc(docRef, { saveCount: increment(newIsSaved ? 1 : -1) });
    } catch (error) {
        console.error("Error syncing save to DB:", error);
    }
  };

  // --- HANDLE LIKE ---
  const handleLike = async () => {
    if (!currentUser) return; 
    
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : likes - 1;

    setIsLiked(newIsLiked);
    setLikes(newLikes);

    if (newIsLiked) localStorage.setItem(LIKE_KEY, 'true');
    else localStorage.removeItem(LIKE_KEY);

    const docRef = doc(db, "shayaris", shayari.id);
    await updateDoc(docRef, { likes: increment(newIsLiked ? 1 : -1) });

    if (newIsLiked && currentUser !== shayari.author) {
        await addDoc(collection(db, "notifications"), {
          toUser: shayari.author, 
          fromUser: currentUser, 
          postId: shayari.id,
          type: 'like', 
          contentSnippet: shayari.content?.substring(0, 30) || "Image Post",
          image: shayari.image || null,
          timestamp: serverTimestamp(),
          read: false
        });
    }
  };

  // --- FETCH LIKERS ---
  const handleShowLikes = async () => {
    if (likes === 0) return;
    setShowLikesModal(true);
    setLoadingLikers(true);
    
    try {
      const q = query(
        collection(db, "notifications"),
        where("postId", "==", shayari.id),
        where("type", "==", "like")
      );
      
      const snapshot = await getDocs(q);
      const users = [...new Set(snapshot.docs.map(doc => doc.data().fromUser))];
      setLikersList(users);
    } catch (error) {
      console.error("Error fetching likers:", error);
    }
    setLoadingLikers(false);
  };

  /// TO THIS:
const handlePostComment = async () => {
  if (!newComment.trim()) return; // <--- New line (removed filter check)
    
    const commentData = { 
        text: newComment, 
        username: currentUser, 
        timestamp: serverTimestamp() 
    };
    
    setNewComment(""); 

    await addDoc(collection(db, "shayaris", shayari.id, "comments"), commentData);

    if (currentUser !== shayari.author) {
        await addDoc(collection(db, "notifications"), {
          toUser: shayari.author, 
          fromUser: currentUser, 
          postId: shayari.id, 
          type: 'comment', 
          contentSnippet: commentData.text.substring(0, 50), 
          image: shayari.image || null,
          timestamp: serverTimestamp(),
          read: false 
        });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Delete this comment?")) {
        await deleteDoc(doc(db, "shayaris", shayari.id, "comments", commentId));
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this post?")) {
      try { await deleteDoc(doc(db, "shayaris", shayari.id)); } catch (error) { console.error("Error deleting", error); }
    }
  };

  // --- SHARE LOGIC ---
  const shareText = `"${shayari.content}" - @${shayari.author} on ShayariGram`;
  const shareUrl = window.location.href;

  const handleWhatsApp = () => { window.open(`whatsapp://send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`); setShowShareMenu(false); };
  const handleTwitter = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`); setShowShareMenu(false); };
  
  const handleDownload = () => {
    if (!shayari.image) return;
    const link = document.createElement('a');
    link.href = shayari.image;
    link.download = `shayarigram_${shayari.author}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowShareMenu(false);
  };

  const handleInstagram = async () => {
    setShowShareMenu(false);
    if (shayari.image && navigator.share) {
        try {
            const response = await fetch(shayari.image);
            const blob = await response.blob();
            const file = new File([blob], "shayari.png", { type: "image/png" });
            await navigator.share({ files: [file], title: 'Share', text: shareText });
        } catch (error) { handleDownload(); }
    } else {
        handleDownload();
        navigator.clipboard.writeText(shareText);
        alert("Image saved & Text copied! You can now post on Instagram.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 mb-6 overflow-visible relative z-0 w-full"
    >
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onProfileClick && onProfileClick(shayari.author)}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <span className="font-bold text-xs bg-gradient-to-tr from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                {shayari.author ? shayari.author[0].toUpperCase() : "A"}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-900 group-hover:text-purple-600 transition">{shayari.author}</span>
            {shayari.category && (
              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-0.5 border border-gray-200">
                {shayari.category}
              </span>
            )}
          </div>
        </div>

        {(isAdmin || isAuthor) ? (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition p-2"><Trash2 size={18} /></button>
        ) : (
          <MoreHorizontal size={18} className="text-gray-300" />
        )}
      </div>

      {/* CONTENT (Responsive Text Size: text-xl on mobile, text-2xl on desktop) */}
      <div className="bg-gradient-to-b from-white to-gray-50/50 min-h-[200px] flex flex-col justify-center relative">
        {shayari.image && <img src={shayari.image} alt="Post" className="w-full h-auto max-h-[500px] object-cover" />}
        {shayari.content && (!shayari.image || !shayari.isTextOnImage) && (
          <div className={`px-8 text-center font-serif text-gray-800 leading-loose text-xl md:text-2xl ${shayari.image ? 'py-6' : 'py-12'}`}>
            "{shayari.content}"
          </div>
        )}
      </div>

      {/* ACTION BAR */}
      <div className="px-4 py-3 relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-6">
            <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike} className="flex items-center gap-1">
              <Heart size={26} strokeWidth={isLiked ? 0 : 1.5} className={`transition-colors duration-300 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-800"}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowComments(!showComments)} className="text-gray-800 hover:opacity-70 transition flex items-center gap-1">
              <MessageCircle size={26} strokeWidth={1.5} />
              {comments.length > 0 && <span className="text-sm font-bold text-gray-600">{comments.length}</span>}
            </motion.button>
            <div className="relative" ref={shareMenuRef}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowShareMenu(!showShareMenu)} className="text-gray-800 hover:opacity-70 transition flex items-center"><Share2 size={26} strokeWidth={1.5} /></motion.button>
                <AnimatePresence>
                    {showShareMenu && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute bottom-10 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 w-48 z-50 origin-bottom-left"
                        >
                            <ShareOption icon={Instagram} label="Instagram" onClick={handleInstagram} color="text-pink-600" />
                            {shayari.image && <ShareOption icon={Download} label="Save to Device" onClick={handleDownload} color="text-blue-600" />}
                            <ShareOption icon={Phone} label="WhatsApp" onClick={handleWhatsApp} color="text-green-500" />
                            <ShareOption icon={Twitter} label="Twitter" onClick={handleTwitter} color="text-sky-500" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.8 }} onClick={handleSave} className="flex items-center gap-1">
            <Bookmark size={26} strokeWidth={isSaved ? 0 : 1.5} className={`transition-colors duration-300 ${isSaved ? "fill-black text-black" : "text-gray-800"}`} />
            {saveCount > 0 && <span className="text-sm font-bold text-gray-600">{saveCount}</span>}
          </motion.button>
        </div>
        
        {/* CLICKABLE LIKES COUNT */}
        <div 
            className={`text-sm font-bold text-gray-900 pl-1 ${likes > 0 ? 'cursor-pointer hover:underline' : ''}`}
            onClick={handleShowLikes}
        >
            {likes} likes
        </div>
      </div>

      {/* COMMENTS SECTION */}
      <AnimatePresence>
      {showComments && (
        <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="bg-gray-50/50 p-4 border-t border-gray-100 overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto mb-3 space-y-4 custom-scrollbar">
            {comments.map((c, i) => (
              <div key={i} className="flex gap-2 items-start group">
                <div className="text-sm flex-1 break-all">
                  <span 
                    className="font-bold text-gray-900 cursor-pointer hover:underline mr-2" 
                    onClick={() => onProfileClick && onProfileClick(c.username)}
                  >
                    @{c.username || "User"}
                  </span>
                  <span className="text-gray-700 whitespace-pre-wrap leading-relaxed">{c.text}</span>
                </div>
                {(isAdmin || c.username === currentUser) && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={14} /></button>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-gray-400 text-center italic">Be the first to comment...</p>}
          </div>
          <div className="flex gap-2 relative">
            <input type="text" placeholder="Add a comment..." className="flex-1 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm focus:outline-none focus:border-purple-500 transition" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <button onClick={handlePostComment} className="absolute right-2 top-1.5 text-purple-600 font-semibold text-xs px-3 py-1.5 hover:bg-purple-50 rounded-full transition">Post</button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* LIKES MODAL */}
      <AnimatePresence>
      {showLikesModal && (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={() => setShowLikesModal(false)}
        >
            <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl relative" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-lg font-serif">Likes</h3>
                    <button onClick={() => setShowLikesModal(false)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"><X size={18} /></button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
                    {loadingLikers ? <p className="text-center text-gray-400 text-sm py-4">Loading...</p> : likersList.length > 0 ? (
                        likersList.map((user, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer" onClick={() => { setShowLikesModal(false); onProfileClick && onProfileClick(user); }}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-xs">{user[0].toUpperCase()}</div>
                                <span className="font-semibold text-sm text-gray-800">@{user}</span>
                            </div>
                        ))
                    ) : <p className="text-center text-gray-400 text-xs py-4">No data available.</p>}
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

const ShareOption = ({ icon: Icon, label, onClick, color }) => (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-xl transition text-left ${color} font-medium text-sm`}>
        <Icon size={20} />
        {label}
    </button>
)

export default ShayariCard;
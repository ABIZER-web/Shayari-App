import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, writeBatch, getDocs } from 'firebase/firestore'; 
import { Heart, Bell, MessageCircle, User } from 'lucide-react'; 

const Notifications = ({ currentUser, onPostClick, onProfileClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. MARK AS READ (Runs once on mount)
  useEffect(() => {
    const markAllRead = async () => {
      if (!currentUser) return;
      
      const q = query(
        collection(db, "notifications"),
        where("toUser", "==", currentUser),
        where("read", "==", false)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });
        await batch.commit();
      }
    };
    markAllRead();
  }, [currentUser]);

  // 2. FETCH AND DISPLAY (Real-time)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("toUser", "==", currentUser)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const othersNotifications = list.filter(n => n.fromUser !== currentUser);

      // Sort by Time (Newest First)
      othersNotifications.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA; 
      });

      setNotifications(othersNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading alerts...</div>;

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2 mb-4 px-2">
        <Bell className="fill-black" /> Notifications
      </h2>

      {notifications.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center text-gray-400">
            <Bell size={40} className="mb-2 opacity-20"/>
            <p>No new notifications.</p>
        </div>
      ) : (
        notifications.map((note) => (
          <div 
            key={note.id} 
            // 1. CLICK CARD -> GO TO POST (Only if postId exists)
            onClick={() => note.postId && onPostClick && onPostClick(note.postId)}
            className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 animate-fade-in hover:bg-gray-50 transition ${note.postId ? 'cursor-pointer' : 'cursor-default'}`}
          >
            
            {/* AVATAR WITH BADGE */}
            <div className="relative">
                {/* User Initial Circle */}
                <div 
                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg border border-gray-200 cursor-pointer hover:border-indigo-300 transition"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onProfileClick) onProfileClick(note.fromUser);
                    }}
                >
                    {note.fromUser ? note.fromUser[0].toUpperCase() : <User size={20}/>}
                </div>

                {/* Small Badge Icon (Heart or Comment) */}
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${note.type === 'like' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                    {note.type === 'like' ? <Heart size={12} fill="currentColor" /> : <MessageCircle size={12} fill="currentColor" />}
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* TEXT CONTENT */}
              <p className="text-sm text-gray-800 leading-snug">
                <span 
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                    // 2. CLICK USERNAME -> GO TO PROFILE (Stop bubbling)
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onProfileClick) onProfileClick(note.fromUser);
                    }}
                >
                    @{note.fromUser}
                </span> 
                <span className="text-gray-600">
                    {note.type === 'like' ? ' liked your post.' : ' commented: '}
                </span>
                {note.type === 'comment' && (
                    <span className="text-gray-800 font-medium">"{note.contentSnippet}"</span>
                )}
              </p>
              
              <div className="flex justify-between items-center mt-1.5">
                {note.type === 'like' && (
                    <p className="text-xs text-gray-400 italic line-clamp-1 max-w-[150px]">
                        {note.contentSnippet ? `"${note.contentSnippet}"` : "View Post"}
                    </p>
                )}
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">{formatTime(note.timestamp)}</span>
              </div>
            </div>
            
            {/* THUMBNAIL IMAGE (If post has one) */}
            {note.image && (
                <img src={note.image} alt="Post" className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-sm" />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;
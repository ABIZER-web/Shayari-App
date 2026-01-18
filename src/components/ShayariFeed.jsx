import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Trophy } from 'lucide-react';
import ShayariCard from './ShayariCard';

const ShayariFeed = ({ onProfileClick }) => {
  const [shayaris, setShayaris] = useState([]);
  const [topPost, setTopPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch last 50 posts to calculate trending
    const q = query(collection(db, "shayaris"), orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // LOGIC: Find best post of last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const recentPosts = list.filter(post => 
        post.timestamp && post.timestamp.toDate() > oneDayAgo
      );

      // Sort by likes
      recentPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));

      if (recentPosts.length > 0 && recentPosts[0].likes > 0) {
        setTopPost(recentPosts[0]);
      } else {
        setTopPost(null);
      }

      setShayaris(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-400">Loading feed...</div>;

  return (
    <div className="space-y-6">
      
      {/* 🏆 TOP SHAYARI OF THE DAY */}
      {topPost && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-2">
             <Trophy size={20} className="text-yellow-500 fill-yellow-500 animate-pulse" />
             <h2 className="font-bold text-gray-800 text-sm tracking-wide uppercase">Top Pick of the Day</h2>
          </div>
          <div className="border-2 border-yellow-200 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                #1 TRENDING
             </div>
             <ShayariCard shayari={topPost} onProfileClick={onProfileClick} />
          </div>
        </div>
      )}

      {/* Normal Feed */}
      {shayaris.map((item) => (
        // Don't show the top post again in the main list immediately (optional, but looks cleaner)
        item.id !== topPost?.id && (
            <ShayariCard key={item.id} shayari={item} onProfileClick={onProfileClick} />
        )
      ))}
    </div>
  );
};

export default ShayariFeed;
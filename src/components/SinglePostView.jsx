import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, FileWarning } from 'lucide-react'; // Added icons
import ShayariCard from './ShayariCard';

const SinglePostView = ({ postId, onBack, onProfileClick }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const docRef = doc(db, "shayaris", postId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Loader2 size={32} className="animate-spin mb-3 text-indigo-500" />
        <p className="text-sm font-medium">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-4 shadow-sm transition-all">
        <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition text-gray-700"
        >
            <ArrowLeft size={22} />
        </button>
        <h2 className="text-lg font-bold font-serif text-gray-900">
            {post ? `${post.category || 'Post'} Details` : 'Post'}
        </h2>
      </div>

      <div className="px-4 pt-4">
        {post ? (
          <div className="animate-fade-in">
             <ShayariCard 
                shayari={post} 
                onProfileClick={onProfileClick} 
             />
          </div>
        ) : (
          /* Not Found State */
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <FileWarning size={32} />
            </div>
            <p className="font-medium text-gray-500">Post unavailable</p>
            <p className="text-xs mt-1 text-gray-400 max-w-[200px] text-center">
                This post may have been deleted or the link is invalid.
            </p>
            <button onClick={onBack} className="mt-6 text-indigo-600 font-bold text-sm hover:underline">
                Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePostView;
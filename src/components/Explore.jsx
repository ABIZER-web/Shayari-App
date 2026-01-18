import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Search, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const Explore = ({ onProfileClick }) => {
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        // Fetch more posts to fill the wider screen
        const q = query(collection(db, "shayaris"), orderBy("likes", "desc"), limit(40)); 
        const snap = await getDocs(q);
        setExplorePosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchExplore();
  }, []);

  return (
    <div className="min-h-screen pb-10 w-full">
      {/* Search Bar (Centered and constrained max-width) */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search poets, shayaris, or tags..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition"
            />
        </div>

        {/* Trending Tags */}
        <div className="flex justify-center gap-3 overflow-x-auto pb-2 pt-4 w-full max-w-4xl custom-scrollbar">
            {["Love", "Sad", "Motivation", "Ghalib", "Gulzar", "Romantic", "Life", "Friendship", "Urdu"].map((tag) => (
                <motion.button 
                    key={tag}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 whitespace-nowrap hover:border-purple-300 hover:text-purple-600 transition shadow-sm"
                >
                    <Hash size={14} /> {tag}
                </motion.button>
            ))}
        </div>
      </div>

      {/* FULL SCREEN RESPONSIVE GRID LAYOUT */}
      {/* Mobile: 2, Tablet: 3, Laptop: 4, Large Desktop: 5, XL: 6 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-4 auto-rows-[250px]">
        {loading ? (
            [...Array(15)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-full w-full"></div>
            ))
        ) : (
            explorePosts.map((post, index) => (
                <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                    // Dynamic Grid Spanning for visual interest
                    className={`relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all bg-gray-100 
                        ${(index % 9 === 0) ? 'col-span-2 row-span-2' : ''} 
                        ${(index % 14 === 0) ? 'md:col-span-2' : ''}
                    `}
                >
                    {post.image ? (
                        <img src={post.image} alt="Explore" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-6 bg-white text-center border border-gray-100 relative">
                            {/* Decorative quotes background */}
                            <div className="absolute top-2 left-2 text-6xl text-gray-100 font-serif leading-none">“</div>
                            <p className="text-gray-800 font-serif text-sm md:text-base leading-relaxed line-clamp-6 relative z-10">
                                {post.content}
                            </p>
                        </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-4">
                        <p className="text-white text-xs font-bold mb-0.5">@{post.author}</p>
                        <div className="flex items-center gap-3 text-white/80 text-[10px] font-medium">
                            <span>♥ {post.likes || 0}</span>
                            <span className="uppercase tracking-wider">{post.category}</span>
                        </div>
                    </div>
                </motion.div>
            ))
        )}
      </div>
    </div>
  );
};

export default Explore;
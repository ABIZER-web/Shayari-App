import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { Feather, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [totalPosts, setTotalPosts] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const postSnap = await getCountFromServer(collection(db, "shayaris"));
        setTotalPosts(postSnap.data().count);
        
        // Simulating active users for now (real count requires more logic)
        setActiveUsers("Live"); 
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="mb-4">
        {/* Responsive Grid: 1 col on mobile, 2 cols on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Stats Card */}
            <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white p-5 rounded-3xl shadow-sm border border-blue-50 relative overflow-hidden"
            >
                <div className="absolute -right-4 -top-4 bg-blue-50 w-24 h-24 rounded-full opacity-50"></div>
                <div className="flex items-center gap-2 mb-3 text-blue-600">
                    <TrendingUp size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-wider">Platform Stats</h3>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-blue-400 mb-1">TOTAL SHAYARIS</p>
                            <p className="text-2xl font-bold text-gray-800">{totalPosts}</p>
                        </div>
                        <Feather className="text-blue-300" size={24} />
                    </div>
                    <div className="flex-1 bg-purple-50/50 p-3 rounded-2xl border border-purple-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-purple-400 mb-1">ACTIVE USERS</p>
                            <p className="text-2xl font-bold text-gray-800">{activeUsers}</p>
                        </div>
                        <Users className="text-purple-300" size={24} />
                    </div>
                </div>
            </motion.div>

            {/* Trending/Welcome Card */}
            <motion.div 
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-3xl shadow-sm border border-yellow-100 flex flex-col justify-center relative overflow-hidden"
            >   
                <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    #1 TRENDING
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-yellow-200 flex items-center justify-center text-xs font-bold text-purple-600">
                        A
                    </div>
                    <span className="text-sm font-bold text-gray-800">admin</span>
                </div>
                <p className="text-gray-700 font-serif text-lg leading-relaxed text-center px-4 py-2 italic">
                    "Welcome to ShayariGram! This is the first official post."
                </p>
            </motion.div>
        </div>
    </div>
  );
};

export default Dashboard;
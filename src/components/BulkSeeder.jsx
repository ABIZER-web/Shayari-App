import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Database } from 'lucide-react';

const BulkSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 1. Define Famous Authors & Admin with Bios
  const famousProfiles = [
    { username: "admin", bio: "The Creator of ShayariGram. Maintaining peace and poetry.", location: "Headquarters" },
    { username: "mirza_ghalib", bio: "Urdu poet of the Mughal Empire. 'Pain is my muse.'", location: "Old Delhi, India" },
    { username: "gulzar", bio: "Film director, lyricist and poet. Weaving emotions into words.", location: "Mumbai, India" },
    { username: "jaun_eliya", bio: "An anarchist of the soul. The master of sorrow.", location: "Karachi, Pakistan" },
    { username: "rumi", bio: "Sufi mystic. 'What you seek is seeking you.'", location: "Konya" },
    { username: "rahat_indori", bio: "Bulati hai magar jaane ka nahi.", location: "Indore, India" }
  ];

  // 2. Define Shayaris linked to those usernames
  const shayaris = [
    { content: "Ishq ne 'Ghalib' nikamma kar diya, varna hum bhi aadmi they kaam ke.", author: "mirza_ghalib" },
    { content: "Hazaaron khwahishen aisi ke har khwahish pe dam nikle.", author: "mirza_ghalib" },
    { content: "Tujhse naraz nahi zindagi, hairaan hoon main.", author: "gulzar" },
    { content: "Aane wala pal jaane wala hai.", author: "gulzar" },
    { content: "Shayad mujhe kisi se mohabbat nahi hui, lekin yaqeen sabko dilata raha hoon main.", author: "jaun_eliya" },
    { content: "Kaun kehta hai ki maut aayi to mar jaunga, Main to darya hoon samandar mein utar jaunga.", author: "rahat_indori" },
    { content: "Welcome to ShayariGram! This is the first official post.", author: "admin" },
    { content: "Keep writing, keep sharing. Let the words flow.", author: "admin" }
  ];

  const handleBulkUpload = async () => {
    if(!window.confirm("This will create User Profiles and Post Shayaris. Continue?")) return;
    
    setLoading(true);
    setStatus("Starting...");
    
    try {
      // A. Create User Profiles
      for (const user of famousProfiles) {
        // We use setDoc to specify the ID exactly (e.g. 'mirza_ghalib')
        await setDoc(doc(db, "users", user.username), {
          username: user.username,
          bio: user.bio,
          location: user.location,
          joinedAt: new Date(),
          password: "demo" // Dummy password for demo accounts
        });
        setStatus(`Created Profile: ${user.username}`);
      }

      // B. Post Shayaris
      for (const item of shayaris) {
        await addDoc(collection(db, "shayaris"), {
          content: item.content,
          author: item.author,
          image: null,
          likes: Math.floor(Math.random() * 100),
          dislikes: 0,
          timestamp: serverTimestamp()
        });
        setStatus(`Posted shayari by: ${item.author}`);
      }
      
      setStatus("Success! Profiles and Posts created.");
    } catch (error) {
      console.error(error);
      setStatus("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl mb-6">
      <h3 className="font-bold text-yellow-800 flex items-center gap-2">
        <Database size={20}/> Database Seeder
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        Click to create Demo Accounts (Ghalib, Gulzar) and fill their feed.
      </p>
      
      <button 
        onClick={handleBulkUpload}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold shadow w-full"
      >
        {loading ? "Working..." : "Create Profiles & Content"}
      </button>
      
      {status && <div className="mt-2 text-xs font-mono font-bold text-gray-700">{status}</div>}
    </div>
  );
};

export default BulkSeeder;
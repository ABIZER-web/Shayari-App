import { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { User, X, ShieldAlert, Lock } from 'lucide-react';

const UserProfile = ({ onProfileSet }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClaimUsername = async (e) => {
    e.preventDefault();
    let cleanName = username.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (cleanName.length < 3) return setError("Name must be at least 3 letters.");

    // --- SECURE ADMIN LOGIN ---
    if (cleanName === "admin") {
      const password = prompt("ENTER ADMIN PASSWORD:");
      if (password !== "admin123") {
        return setError("Wrong password! You cannot be Admin.");
      }
    }

    setLoading(true);
    setError("");

    try {
      const userRef = doc(db, "users", cleanName);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // If it's already taken, check if it's the admin logging back in
        if (cleanName === "admin") {
           // Admin re-login allowed
        } else {
           setError(`Sorry, "${cleanName}" is already taken!`);
           setLoading(false);
           return;
        }
      } 
      
      // Create/Update user document with default bio if new
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          username: cleanName,
          bio: "✨ Just a poet sharing thoughts.",
          location: "Mumbai, India",
          joinedAt: new Date()
        });
      }

      localStorage.setItem('user_profile', cleanName);
      onProfileSet(cleanName);

    } catch (err) {
      console.error(err);
      setError("Internet error. Try again.");
    }
    setLoading(false);
  };

  // Admin Reset Function (unchanged)
  const handleAdminDelete = async () => {
    const cleanName = username.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanName) return alert("Type a username first!");
    const password = prompt(`ADMIN ONLY: Delete "${cleanName}"?`);
    if (password === "admin123") {
      await deleteDoc(doc(db, "users", cleanName));
      alert(`Deleted ${cleanName}.`);
      setError("");
    } else {
      if (password) alert("Wrong password!");
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {username.toLowerCase() === 'admin' ? <Lock className="text-purple-600"/> : <User size={40} className="text-purple-600" />}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800">
          {username.toLowerCase() === 'admin' ? "Admin Login" : "Choose Identity"}
        </h2>
        
        <form onSubmit={handleClaimUsername} className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. poet_rahul" 
              className="w-full p-4 bg-gray-50 border rounded-xl text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 lowercase"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={15}
            />
            {error && <div className="text-red-500 text-xs mt-2 flex items-center justify-center gap-1"><X size={12}/> {error}</div>}
          </div>

          <button disabled={loading} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-700 transition disabled:opacity-50">
            {loading ? "Checking..." : (username.toLowerCase() === 'admin' ? "Login as Admin" : "Claim Username")}
          </button>
        </form>

        {error.includes("taken") && (
          <button onClick={handleAdminDelete} className="text-xs text-gray-400 flex items-center justify-center gap-1 mx-auto mt-4 border px-3 py-1 rounded-full">
            <ShieldAlert size={12} /> Admin: Reset Name
          </button>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
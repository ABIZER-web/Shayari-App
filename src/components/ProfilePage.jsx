import { useState, useEffect } from 'react';
import { db, storage } from '../firebase'; 
import { collection, query, where, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { Grid, Bookmark, ArrowLeft, LogOut, MapPin, Settings, Camera } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import ShayariCard from './ShayariCard';
import SettingsModal from './SettingsModal'; 

const ProfilePage = ({ profileUser, currentUser, onBack, onLogout, onPostClick }) => {
  const [activeTab, setActiveTab] = useState("posts");
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [userData, setUserData] = useState({ bio: "", location: "", photoURL: null });
  const [loading, setLoading] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const isOwnProfile = profileUser === currentUser;

  useEffect(() => {
    setLoading(true);

    const fetchUserInfo = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", profileUser));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setEditBio(data.bio || "");
          setEditLocation(data.location || "");
          setPreviewImage(data.photoURL || null); 
        }
      } catch (err) { console.error(err); }
    };
    fetchUserInfo();

    const q = query(collection(db, "shayaris"), where("author", "==", profileUser));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      posts.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setUserPosts(posts);
      setLoading(false);
    });

    const fetchSaved = async () => {
      if (isOwnProfile && currentUser) {
        const SAVE_STORAGE_KEY = `saved_posts_${currentUser}`;
        const localSaved = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) || '[]');
        setSavedPosts(localSaved);
      }
    };
    fetchSaved();

    return () => unsubscribePosts();
  }, [profileUser, isOwnProfile, currentUser]);

  // --- UPDATED: Image Change Handler with 1MB Limit ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1MB = 1024 * 1024 bytes
      if (file.size > 1024 * 1024) {
        alert("Image size must be less than 1MB.");
        return; // Stop execution
      }

      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setIsUploading(true);
    try {
      let photoURL = userData.photoURL; 

      if (imageFile) {
        // Upload path: profile_images/username/timestamp_filename
        const imageRef = ref(storage, `profile_images/${currentUser}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(doc(db, "users", currentUser), { 
        bio: editBio, 
        location: editLocation,
        photoURL: photoURL
      });

      setUserData({ ...userData, bio: editBio, location: editLocation, photoURL: photoURL });
      setIsEditing(false);
      setImageFile(null); 
    } catch (err) { 
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-gray-900 relative">
      
      {showSettings && (
        <SettingsModal 
          currentUser={currentUser} 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          onPostClick={onPostClick} 
        />
      )}

      {/* HEADER (Mobile Only Back Button) */}
      <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between transition-all">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={22} /></button>
            <h2 className="text-lg font-bold tracking-wide">@{profileUser}</h2>
        </div>
        {isOwnProfile && (
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600">
                <Settings size={22} />
            </button>
        )}
      </div>

      {/* PROFILE INFO SECTION */}
      <div className="w-full px-6 pt-8 pb-8">
        
        {/* Desktop Back Button */}
        <div className="hidden md:flex items-center mb-6">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-500 hover:text-black transition font-medium px-3 py-2 hover:bg-gray-100 rounded-lg"
            >
                <ArrowLeft size={20} /> Back
            </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 mb-8">
          
          {/* Avatar */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group"
          >
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[3px] shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-white rounded-full overflow-hidden flex items-center justify-center">
                {previewImage || userData.photoURL ? (
                  <img 
                    src={previewImage || userData.photoURL} 
                    alt={profileUser} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-800 text-4xl md:text-6xl font-bold">
                    {profileUser[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Image Overlay */}
            {isEditing && (
              <label 
                htmlFor="profile-image-upload"
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={24} />
                <span className="text-xs font-bold mt-1">Change</span>
                <input 
                  id="profile-image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            )}
          </motion.div>

          {/* Details */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h3 className="font-bold text-2xl md:text-3xl text-gray-800">{profileUser}</h3>
                
                {isOwnProfile && !isEditing && (
                    <div className="hidden md:flex gap-2">
                        <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition">Edit Profile</button>
                        <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full"><Settings size={20}/></button>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="flex justify-center md:justify-start gap-8 md:gap-12 mb-5 text-base">
                <StatBox count={userPosts.length} label="posts" />
                <StatBox count={0} label="followers" />
                <StatBox count={0} label="following" />
            </div>

            {/* Bio Section */}
            <div className="space-y-2">
                {isEditing ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-left">
                      <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" className="w-full p-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio..." className="w-full p-2 bg-white border rounded-lg h-20 resize-none text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <div className="flex gap-2">
                          <button 
                            onClick={handleSaveProfile} 
                            disabled={isUploading}
                            className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                          >
                            {isUploading ? "Saving..." : "Save"}
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditing(false);
                              setPreviewImage(userData.photoURL);
                              setImageFile(null);
                            }} 
                            disabled={isUploading}
                            className="flex-1 bg-white border text-gray-700 py-2 rounded-lg text-sm font-bold"
                          >
                            Cancel
                          </button>
                      </div>
                    </motion.div>
                ) : (
                    <>
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm md:text-base">{userData.bio || "✨ Just a poet sharing thoughts."}</p>
                        {userData.location && <p className="text-sm text-gray-500 font-medium flex items-center justify-center md:justify-start gap-1"><MapPin size={16}/> {userData.location}</p>}
                    </>
                )}
            </div>

            {/* Mobile Action Buttons */}
            {isOwnProfile && !isEditing && (
                <div className="flex md:hidden gap-2 mt-6">
                    <button onClick={() => setIsEditing(true)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-200 transition">Edit Profile</button>
                    <button onClick={onLogout} className="py-2 px-4 bg-gray-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition"><LogOut size={18}/></button>
                </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-t border-gray-200 sticky top-[60px] md:top-0 bg-white z-10">
            <TabButton icon={Grid} label="POSTS" active={activeTab === 'posts'} onClick={() => setActiveTab("posts")} />
            {isOwnProfile && <TabButton icon={Bookmark} label="SAVED" active={activeTab === 'saved'} onClick={() => setActiveTab("saved")} />}
        </div>

        {/* CONTENT GRID */}
        <div className="py-6 min-h-[300px]">
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-6"
                    >
                        {(activeTab === 'posts' ? userPosts : savedPosts).length > 0 ? (
                            (activeTab === 'posts' ? userPosts : savedPosts).map(p => (
                                // Mobile View
                                <div key={p.id} className="md:hidden">
                                    <ShayariCard shayari={p} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full"><EmptyState text={activeTab === 'posts' ? "No posts yet." : "No saved items."} /></div>
                        )}
                        
                        {/* Desktop Grid View */}
                        {(activeTab === 'posts' ? userPosts : savedPosts).map(p => (
                             <div 
                                key={`desk-${p.id}`} 
                                className="hidden md:block aspect-square group relative cursor-pointer bg-gray-100 overflow-hidden rounded-none md:rounded-lg"
                                onClick={() => onPostClick && onPostClick(p.id)} 
                             >
                                {p.image ? (
                                    <img src={p.image} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-4 text-center font-serif text-gray-700 bg-white border border-gray-100">
                                        <span className="line-clamp-4">"{p.content}"</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white font-bold">
                                    <span>♥ {p.likes || 0}</span>
                                </div>
                             </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ count, label }) => (
  <div className="flex flex-col md:flex-row md:gap-1 items-center md:items-baseline">
    <span className="font-bold text-lg md:text-xl text-gray-900">{count}</span>
    <span className="text-xs md:text-base text-gray-500">{label}</span>
  </div>
);

const TabButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex-1 flex justify-center items-center gap-2 py-3 border-t-2 md:border-t-0 md:border-b-2 transition uppercase text-xs font-bold tracking-widest ${active ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
    <Icon size={16} />
    <span className="hidden md:inline">{label}</span>
  </button>
);

const EmptyState = ({ text }) => (
  <div className="text-center py-20 flex flex-col items-center text-gray-400">
    <Grid size={40} className="mb-3 opacity-20"/>
    <p>{text}</p>
  </div>
);

export default ProfilePage;
import { useState, useEffect } from 'react';
import ShayariCard from './ShayariCard';
import { BookmarkX, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SavedPage = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySavedShayaris = async () => {
      // 1. Get list from Local Storage
      const localData = JSON.parse(localStorage.getItem('savedShayaris') || '[]');
      
      if (localData.length === 0) {
        setSaved([]);
        setLoading(false);
        return;
      }

      // 2. Check Database for each item
      // We use Promise.all to check them all at the same time (faster)
      const checkPromises = localData.map(async (item) => {
        const docRef = doc(db, "shayaris", item.id);
        const docSnap = await getDoc(docRef);
        
        // If it exists in DB, return the LATEST data. If not, return null.
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        } else {
          return null; // This means it was deleted by Admin
        }
      });

      const results = await Promise.all(checkPromises);
      
      // 3. Filter out the nulls (the deleted ones)
      const validItems = results.filter(item => item !== null);

      // 4. Update State AND Local Storage with the clean list
      setSaved(validItems);
      localStorage.setItem('savedShayaris', JSON.stringify(validItems));
      setLoading(false);
    };

    verifySavedShayaris();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Your Collection</h2>
        {loading && <RefreshCw className="animate-spin text-purple-600" size={20} />}
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-gray-500">Checking for updates...</div>
      ) : saved.length === 0 ? (
        <div className="text-center text-gray-400 py-10 flex flex-col items-center">
          <BookmarkX size={48} className="mb-2 opacity-50"/>
          <p>You haven't saved any Shayaris yet.</p>
        </div>
      ) : (
        saved.map((item) => (
          <ShayariCard key={item.id} shayari={item} />
        ))
      )}
    </div>
  );
};

export default SavedPage;
import { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore'; 
import { Send, Image as ImageIcon, X, Wand2, RefreshCw, Type, AlertTriangle } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';


// --- BulkSeeder Placeholder (Only used by Admin) ---
const BulkSeeder = () => <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-dashed border-gray-300">Bulk Seeder Component Placeholder</div>;

const PostShayari = ({ username }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [selectedImage, setSelectedImage] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null);   
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTextOnImage, setIsTextOnImage] = useState(false); 
  const [textChanged, setTextChanged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  
  const canvasRef = useRef(null);
  const CATEGORIES = ["General", "Love", "Sad", "Poetry", "Quotes", "Motivation", "Life", "Friendship"];

  useEffect(() => {
    if (!isTextOnImage) setTextChanged(false);
  }, [isTextOnImage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) return; 
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setPreviewImage(reader.result);
        setIsTextOnImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (e) => {
    setContent(e.target.value);
    if (isTextOnImage) setTextChanged(true);
  };

  // --- DELETE ALL FUNCTION (ADMIN ONLY) ---
  const handleDeleteAll = async () => {
    if (!window.confirm("⚠️ Are you sure you want to DELETE ALL Shayaris?")) return;

    setIsDeleting(true);
    try {
      const querySnapshot = await getDocs(collection(db, "shayaris"));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting all:", error);
    }
    setIsDeleting(false);
  };

  const generateCompositeImage = () => {
    if (!selectedImage || !content.trim()) return;
    setIsGenerating(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const fontSize = Math.max(32, canvas.width / 22); 
      ctx.font = `italic bold ${fontSize}px serif`; 
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      const padding = 40; 
      const maxWidth = canvas.width - (padding * 2);
      
      const paragraphs = content.split('\n'); 
      let finalLines = [];

      paragraphs.forEach((para) => {
        if (para.trim() === '') {
            finalLines.push(' '); 
            return;
        }
        
        const words = para.split(' ');
        let line = '';
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && n > 0) {
            finalLines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        finalLines.push(line);
      });
      
      const lineHeight = fontSize * 1.5;
      const totalTextHeight = finalLines.length * lineHeight;
      let startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2); 

      finalLines.forEach((l, i) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + (i * lineHeight));
      });
      
      setPreviewImage(canvas.toDataURL('image/jpeg', 0.85));
      setIsGenerating(false);
      setIsTextOnImage(true);
      setTextChanged(false);
    };
    img.src = selectedImage;
  };

  const removeTextFromImage = () => {
    setPreviewImage(selectedImage); 
    setIsTextOnImage(false);
  };

  const clearAll = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setIsTextOnImage(false);
    setContent('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;

    setIsSubmitting(true);
    try {
      const finalImage = isTextOnImage ? previewImage : selectedImage;

      await addDoc(collection(db, "shayaris"), {
        content: content, 
        author: username || "Anonymous",
        category: category,
        image: finalImage || null, 
        isTextOnImage: isTextOnImage, 
        likes: 0,
        saveCount: 0,
        timestamp: serverTimestamp()
      });
      
      clearAll();
      setCategory('General');
      alert("Post created successfully!");
      
    } catch (err) {
      console.error(err);
      alert("Failed to create post. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-purple-100 relative font-sans w-full"
    >
      <canvas ref={canvasRef} className="hidden"></canvas>
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-serif">Create Post</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Buttons */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Select Category</label>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${category === cat ? 'bg-black text-white border-black shadow-md scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <textarea
          placeholder={`Write something beautiful in ${category}...`}
          className="w-full p-4 border border-gray-200 rounded-2xl h-32 md:h-40 focus:outline-none focus:border-purple-500 bg-gray-50/50 resize-none font-serif text-lg transition placeholder:text-gray-400"
          value={content}
          onChange={handleTextChange}
          maxLength={500}
        />

        {/* Image Preview Area */}
        <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="relative w-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner group border border-gray-200"
          >
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[400px] object-contain block mx-auto" />
            
            <button type="button" onClick={clearAll} className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 backdrop-blur-sm transition z-10"><X size={18} /></button>
            
            <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2 items-end z-10 p-2 w-full">
              {isTextOnImage && textChanged && !isGenerating && (
                <button type="button" onClick={generateCompositeImage} className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl hover:bg-yellow-600 transition animate-bounce">
                  <RefreshCw size={14}/> Update Text
                </button>
              )}
              {selectedImage && content.trim() && !isTextOnImage && !isGenerating && (
                  <button type="button" onClick={generateCompositeImage} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition">
                    <Wand2 size={14}/> Add Text to Image
                  </button>
              )}
              {isTextOnImage && !isGenerating && (
                <button type="button" onClick={removeTextFromImage} className="bg-white/90 text-red-600 border border-red-100 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl hover:bg-red-50 transition">
                  <Type size={14}/> Remove Text
                </button>
              )}
              {isGenerating && (
                  <div className="bg-black/70 text-white px-4 py-2 rounded-full font-bold text-xs backdrop-blur-sm">
                    Processing...
                  </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Bottom Toolbar */}
        <div className="flex justify-between items-center pt-2">
          <label className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-purple-600 transition bg-gray-100 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-200">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <ImageIcon size={20} />
            <span className="text-sm hidden md:inline">Add Photo</span>
          </label>

          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            disabled={isSubmitting || isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-2.5 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-md text-base"
          >
            {isSubmitting ? "Posting..." : <>Post <Send size={18} className="ml-1" /></>}
          </motion.button>
        </div>
      </form>
      
      {/* Admin Panel (Only visible if username is 'admin') */}
      {username === 'admin' && (
        <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Admin Zone</h4>
          <BulkSeeder />
          <button 
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="w-full border-2 border-red-100 bg-red-50 text-red-600 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2"
          >
            {isDeleting ? "Deleting..." : <><AlertTriangle size={20} /> DELETE ALL SHAYARIS</>}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default PostShayari;
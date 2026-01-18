import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, Lock, User, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ onLogin }) => {
  const [viewState, setViewState] = useState("login"); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); 
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (viewState === "signup") {
        // --- SIGN UP LOGIC ---
        if (!username.trim()) throw new Error("Username is required");
        
        const userDoc = await getDoc(doc(db, "users", username));
        if (userDoc.exists()) throw new Error("Username already taken. Choose another.");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: username });

        await setDoc(doc(db, "users", username), {
          uid: user.uid,
          email: user.email,
          bio: "Just joined ShayariGram!",
          location: "Unknown",
          createdAt: new Date()
        });

        onLogin(username);

      } else {
        // --- LOGIN LOGIC ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        onLogin(user.displayName || user.email.split('@')[0]); 
      }
    } catch (err) {
      console.error(err);
      let msg = err.message.replace("Firebase: ", "").replace("auth/", "").replace(/-/g, " ");
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address first."); return; }
    
    setError(""); setSuccessMsg(""); setLoading(true);

    try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg(`Reset link sent to ${email}`);
    } catch (err) {
        console.error(err);
        let msg = err.message.replace("Firebase: ", "").replace("auth/", "").replace(/-/g, " ");
        setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans relative overflow-hidden">
      
      {/* --- ANIMATED BACKGROUND --- */}
      <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none">
        <motion.div 
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }} 
            transition={{ duration: 8, repeat: Infinity }} 
            className="absolute top-0 -left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        ></motion.div>
        <motion.div 
            animate={{ x: [0, -30, 0], y: [0, 30, 0] }} 
            transition={{ duration: 10, repeat: Infinity, delay: 1 }} 
            className="absolute top-0 -right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        ></motion.div>
        <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ duration: 12, repeat: Infinity, delay: 2 }} 
            className="absolute -bottom-20 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        ></motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl w-full max-w-sm border border-white/50 relative z-10"
      >
        {/* --- HEADER --- */}
        <div className="text-center mb-6">
            <motion.h1 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent font-serif mb-2"
            >
                ShayariGram
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.3 }} 
                className="text-gray-500 text-sm"
            >
                {viewState === "signup" ? "Join the community of poets." 
                : viewState === "forgot" ? "Reset your password." 
                : "Welcome back, poet."}
            </motion.p>
        </div>

        {/* --- ERROR / SUCCESS MESSAGES --- */}
        <AnimatePresence mode="wait">
            {error && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl flex items-center gap-2 border border-red-100 overflow-hidden"
                >
                    <AlertCircle size={16} /> {error}
                </motion.div>
            )}
            {successMsg && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="mb-4 p-3 bg-green-50 text-green-600 text-xs font-medium rounded-xl flex items-center gap-2 border border-green-100 overflow-hidden"
                >
                    <CheckCircle2 size={16} /> {successMsg}
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
        {viewState === "forgot" ? (
            /* --- FORGOT PASSWORD FORM --- */
            <motion.form 
                key="forgot" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }} 
                onSubmit={handlePasswordReset} 
                className="space-y-4"
            >
                 <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition" size={20} />
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>

                <motion.button 
                    whileTap={{ scale: 0.98 }} 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </motion.button>

                <button 
                    type="button" 
                    onClick={() => { setViewState("login"); setError(""); setSuccessMsg(""); }} 
                    className="w-full text-gray-500 text-sm font-medium py-2 hover:text-gray-800 transition flex items-center justify-center gap-1"
                >
                    <ArrowLeft size={14} /> Back to Sign In
                </button>
            </motion.form>
        ) : (
            /* --- LOGIN / SIGNUP FORM --- */
            <motion.form 
                key="main" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                onSubmit={handleSubmit} 
                className="space-y-4"
            >
                <AnimatePresence>
                {viewState === "signup" && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="relative group overflow-hidden"
                    >
                        <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition" size={20} />
                        <input 
                            type="text" 
                            placeholder="Choose Username" 
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())} 
                            required 
                        />
                    </motion.div>
                )}
                </AnimatePresence>

                <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition" size={20} />
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition" size={20} />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6} 
                    />
                </div>

                {viewState === "login" && (
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={() => { setViewState("forgot"); setError(""); }} 
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                        >
                            Forgot Password?
                        </button>
                    </div>
                )}

                <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (viewState === "signup" ? "Create Account" : "Sign In")}
                </motion.button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        {viewState === "signup" ? "Already have an account?" : "Don't have an account?"}
                        <button 
                            type="button" 
                            onClick={() => { setViewState(viewState === "signup" ? "login" : "signup"); setError(""); }} 
                            className="ml-2 font-bold text-indigo-600 hover:underline"
                        >
                            {viewState === "signup" ? "Sign In" : "Sign Up"}
                        </button>
                    </p>
                </div>
            </motion.form>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
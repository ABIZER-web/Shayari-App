// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <--- ADD THIS

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZMVC4ZV6dem5ncaj40YyWv0Zv3Ee7kMk",
  authDomain: "shayari-app-9044b.firebaseapp.com",
  projectId: "shayari-app-9044b",
  storageBucket: "shayari-app-9044b.firebasestorage.app",
  messagingSenderId: "938990595238",
  appId: "1:938990595238:web:4de70a4dd285e689981867",
  measurementId: "G-YFTM8TNGFH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and Export Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // <--- ADD THIS (Exports 'storage' so ProfilePage can use it)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASVyopoBJWuIzZPmmub0dPpfSzFFbXrWM",
  authDomain: "railaai.firebaseapp.com",
  projectId: "railaai",
  storageBucket: "railaai.firebasestorage.app",
  messagingSenderId: "923476918767",
  appId: "1:923476918767:web:bee1220d5e5289dda8f61a",
  measurementId: "G-CW22M7MJRY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- THIS IS THE FIX ---
// We must explicitly tell getFirestore which database to use.
export const db = getFirestore(app, "raila-chat-db"); // <-- ADDED "raila-chat-db"
export const auth = getAuth(app);
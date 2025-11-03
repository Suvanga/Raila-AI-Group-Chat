// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// --- IMPORT THE SERVICES YOU NEED ---
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// We don't need getAnalytics right now, so I've removed it for simplicity

// Your web app's Firebase configuration
// (This is the object you copied from the Firebase console)
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

// --- INITIALIZE AND EXPORT THE SERVICES ---
// These are the variables you will import into your React components
export const auth = getAuth(app);
export const db = getFirestore(app);


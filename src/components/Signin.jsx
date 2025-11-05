import React from 'react';
import { auth, db } from '../firebase-config.js'; // Import both auth and db
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions

function SignIn() {
  const signInWithGoogle = () => {
    console.log("Attempting Google Sign-In...");
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        console.log("Sign-in successful for:", user.displayName);
        
        // Try to save user to database
        const userRef = doc(db, 'users', user.uid);
        console.log("Creating document reference...");
        
        try {
          await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastSeen: serverTimestamp()
          }, { merge: true });
          
          console.log("SUCCESS: User saved to Firestore:", user.uid);
          
        } catch (firestoreError) {
          // This will catch errors from setDoc
          console.error("FIRESTORE ERROR:", firestoreError.message);
          console.error("Error Code:", firestoreError.code);
          alert(`Error saving user: ${firestoreError.message}`);
        }
        
      })
      .catch((authError) => {
        // This will catch errors from signInWithPopup
        console.error("AUTH ERROR:", authError.message);
        console.error("Error Code:", authError.code);
        alert(`Error signing in: ${authError.message}`);
      });
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-box">
        <h2>Welcome to <span>Raila AI</span></h2>
        <p>Sign in with Google to join the conversation.</p>
        <button className="sign-in-btn" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default SignIn;
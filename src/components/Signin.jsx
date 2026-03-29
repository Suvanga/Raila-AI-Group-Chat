import React, { useState } from 'react';
import { auth, db } from '../firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

async function saveUserToFirestore(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastSeen: serverTimestamp()
    }, { merge: true });
    console.log("User saved to Firestore:", user.uid);
  } catch (err) {
    console.error("Firestore save error:", err.code, err.message);
  }
}

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  const signInWithGoogle = async () => {
    setSigningIn(true);
    setError(null);

    try {
      // Try popup first (works on most desktop browsers)
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);
    } catch (popupError) {
      console.warn("Popup sign-in failed:", popupError.code, popupError.message);

      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/popup-closed-by-user' ||
        popupError.code === 'auth/cancelled-popup-request'
      ) {
        // Fallback to redirect-based sign-in
        try {
          await signInWithRedirect(auth, provider);
          // Page will redirect — no further code runs
          return;
        } catch (redirectError) {
          console.error("Redirect sign-in failed:", redirectError.code, redirectError.message);
          setError('Sign-in failed. Please allow popups for this site or try again.');
        }
      } else if (popupError.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for sign-in. Add it to Firebase Console → Authentication → Settings → Authorized domains.');
      } else {
        setError(popupError.message || 'Sign-in failed. Please try again.');
      }
      setSigningIn(false);
    }
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-box">
        <h2>Welcome to <span>Raila AI</span></h2>
        <p>Realtime group chat with AI-assisted conversations. Sign in to start chatting.</p>
        <button className="sign-in-btn" onClick={signInWithGoogle} disabled={signingIn}>
          {signingIn ? (
            <div className="spinner" style={{ width: 20, height: 20 }}></div>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {signingIn ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <p className="sign-in-error">{error}</p>}
        <p className="sign-in-footer">Built by Diptesh & Suvanga</p>
      </div>
    </div>
  );
}

export default SignIn;
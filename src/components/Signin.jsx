import React from 'react';
import { auth } from '../firebase-config.js';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .catch((error) => console.error(error.message));
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-box">
        <h2>Welcome to Raila AI Chat</h2>
        <p>Sign in with Google to join the conversation.</p>
        <button className="sign-in-btn" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default SignIn;

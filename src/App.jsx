import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Import our new CSS styles
import './App.css'; 

// Import our new components
import ChatRoom from './components/ChatRoom.jsx';
import SignIn from './components/Signin.jsx';

// Main App component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] =useState(true);

  // Listen for user login/logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Cleanup listener
    return () => unsubscribe();
  }, []);

  // Show a loading screen while Firebase checks for a user
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Raila AI <span>Chat</span></h1>
        {user && <SignOut />}
      </header>

      {/* Conditionally render ChatRoom or SignIn */}
      {/* The components will fill the remaining space */}
      {user ? <ChatRoom /> : <SignIn />}
    </div>
  );
}

// SignOut Button Component
function SignOut() {
  return (
    <button className="sign-out-btn" onClick={() => signOut(auth)}>
      Sign Out
    </button>
  );
}

export default App;


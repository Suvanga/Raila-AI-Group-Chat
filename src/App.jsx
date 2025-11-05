import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import './App.css'; 

import ChatRoom from './components/ChatRoom.jsx';
import SignIn from './components/Signin.jsx';
import Sidebar from './components/Sidebar.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // This state will control which chat room is visible.
  const [activeChat, setActiveChat] = useState({
    id: 'public',
    name: 'Raila AI Group Chat'
  });

  useEffect(() => {
    // This listener is the core of the app.
    // It runs once on load, and any time the user logs in or out.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Will be null if logged out, or a user object if logged in
      setLoading(false);
    });
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Show a loading spinner while Firebase is checking auth state
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="App">
      {!user ? (
        // IF NOT LOGGED IN: Show the full-screen sign-in page
        <SignIn />
      ) : (
        // IF LOGGED IN: Show the 2-column chat app
        <>
          <Sidebar 
            user={user} 
            activeChat={activeChat} 
            setActiveChat={setActiveChat} 
          />
          <main className="chat-panel">
            <header className="chat-header">
              <h2>{activeChat.name}</h2>
              <SignOut />
            </header>
            <ChatRoom chatId={activeChat.id} />
          </main>
        </>
      )}
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


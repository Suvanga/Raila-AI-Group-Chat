import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import './App.css'; 

import ChatRoom from './components/ChatRoom.jsx';
import SignIn from './components/Signin.jsx';
import Sidebar from './components/Sidebar.jsx';
import CreateGroupModal from './components/CreateGroupModal.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // AI configuration state
  const [aiModel, setAiModel] = useState('Generic');
  const [aiMode, setAiMode] = useState('Sushil');

  // This state will control which chat room is visible.
  const [activeChat, setActiveChat] = useState({
    id: 'public',
    name: 'Public Chat'
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

  // Close sidebar on room switch (mobile)
  const handleSetActiveChat = (chat) => {
    setActiveChat(chat);
    setSidebarOpen(false);
  };

  // Show a loading spinner while Firebase is checking auth state
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading Raila AI Chat...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        // IF NOT LOGGED IN: Show the full-screen sign-in page
        <SignIn />
      ) : (
        // IF LOGGED IN: Show the 2-column chat app
        <>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          <Sidebar 
            user={user} 
            activeChat={activeChat} 
            setActiveChat={handleSetActiveChat}
            setShowCreateGroupModal={setShowCreateGroupModal}
            isOpen={sidebarOpen}
          />

          <main className="chat-panel">
            <header className="chat-header">
              <div className="chat-header-left">
                <button 
                  className="hamburger-btn" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
                <h2>{activeChat.name}</h2>
              </div>
              <SignOut />
            </header>
            <ChatRoom 
              chatId={activeChat.id} 
              chatName={activeChat.name}
              aiModel={aiModel}
              aiMode={aiMode}
            />
          </main>

          {/* Create Group Modal */}
          {showCreateGroupModal && (
            <CreateGroupModal setShowModal={setShowCreateGroupModal} />
          )}
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
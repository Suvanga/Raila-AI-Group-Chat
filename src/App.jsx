import React, { useState } from 'react';
import { auth, functions } from './firebase-config.js';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import './App.css'; 

import ChatRoom from './components/ChatRoom.jsx';
import SignIn from './components/Signin.jsx';
import Sidebar from './components/Sidebar.jsx';
import CreateGroupModal from './components/CreateGroupModal.jsx';
import { useAuth } from './hooks/useAuth.js';
import { usePresence } from './hooks/usePresence.js';

function App() {
  const { user, loading } = useAuth();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // AI configuration state
  const [aiModel, setAiModel] = useState('Generic');
  const [aiMode, setAiMode] = useState('Sushil');

  const [activeChat, setActiveChat] = useState({
    id: 'public',
    name: 'Public Chat'
  });

  // Track online presence for the logged-in user
  usePresence();

  // Close sidebar on room switch (mobile)
  const handleSetActiveChat = (chat) => {
    setActiveChat(chat);
    setSidebarOpen(false);
    setSummary(null);
  };

  // Summarize the current room via Cloud Function
  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const summarizeRoom = httpsCallable(functions, 'summarizeRoom');
      const result = await summarizeRoom({ chatId: activeChat.id });
      setSummary(result.data?.summary || 'No summary available.');
    } catch (err) {
      console.error('Summarize error:', err);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
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
              <div className="chat-header-right">
                <button
                  className="summarize-btn"
                  onClick={handleSummarize}
                  disabled={summaryLoading}
                  title="AI Summary of this room"
                >
                  {summaryLoading ? 'Summarizing...' : '✨ Summarize'}
                </button>
                <SignOut />
              </div>
            </header>

            {/* AI Summary Panel */}
            {summary && (
              <div className="summary-panel">
                <div className="summary-header">
                  <span className="summary-label">✨ AI Summary</span>
                  <button className="summary-close" onClick={() => setSummary(null)}>✕</button>
                </div>
                <div className="summary-body">{summary}</div>
              </div>
            )}

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
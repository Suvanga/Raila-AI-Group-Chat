import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import './App.css'; 

import ChatRoom from './components/ChatRoom.jsx';
import SignIn from './components/Signin.jsx';
import Sidebar from './components/Sidebar.jsx';
import CreateGroupModal from './components/CreateGroupModal.jsx';
import InviteGate from './components/InviteGate.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import GroupMembersPanel from './components/GroupMembersPanel.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { useAuth } from './hooks/useAuth.js';
import { usePresence } from './hooks/usePresence.js';
import { useToast } from './hooks/useToast.js';

const AI_MODELS = [
  { value: 'Generic', label: 'General', icon: '💬' },
  { value: 'Trip Planner', label: 'Trip Planner', icon: '✈️' },
  { value: 'Date Planner', label: 'Date Planner', icon: '❤️' },
  { value: 'Budgeting', label: 'Budgeting', icon: '💰' },
  { value: 'Homework Help', label: 'Homework', icon: '📚' },
];

const AI_PERSONALITIES = [
  { value: 'Sushil', label: 'Sushil', desc: 'Polite & Formal' },
  { value: 'Chada', label: 'Chada', desc: 'Frank & Sassy' },
];

function App() {
  const { user, loading } = useAuth();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [approved, setApproved] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  const [aiModel, setAiModel] = useState('Generic');
  const [aiMode, setAiMode] = useState('Sushil');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Approval and role come from Firestore; missing users stay gated.
  useEffect(() => {
    if (!user) {
      setApproved(null);
      setUserRole(null);
      return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setApproved(data.approved === true);
          setUserRole(data.role || null);
        } else {
          setApproved(false);
          setUserRole(null);
        }
      },
      (err) => {
        console.error('Error checking approval:', err);
        setApproved(false);
        setUserRole(null);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const [activeChat, setActiveChat] = useState({
    id: 'public',
    name: 'Public Chat'
  });

  // Track online presence for the logged-in user
  usePresence(user);

  // Close sidebar on room switch (mobile)
  const handleSetActiveChat = (chat) => {
    setActiveChat(chat);
    setSidebarOpen(false);
    setSummary(null);
    setShowMembersPanel(false);
  };

  // Summarize — requires Cloud Functions (Blaze plan)
  const handleSummarize = async () => {
    setSummary('⚠️ AI Summary requires Firebase Blaze plan (Cloud Functions). Upgrade your project to enable this feature.');
  };

  if (loading || (user && approved === null)) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading Raila AI Chat...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {!user ? (
        <SignIn />
      ) : !approved ? (
        <InviteGate onApproved={() => setApproved(true)} />
      ) : (
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
            userRole={userRole}
            setShowAdminPanel={setShowAdminPanel}
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
                  className={`header-icon-btn ${searchOpen ? 'active' : ''}`}
                  onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
                  title="Search messages"
                >
                  🔍
                </button>
                <button
                  className="header-icon-btn"
                  onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                  title="Pinned messages"
                >
                  📌
                </button>
                {activeChat.isGroup && (
                  <button
                    className="header-icon-btn"
                    onClick={() => setShowMembersPanel(true)}
                    title="Members"
                  >
                    👥
                  </button>
                )}
                <button
                  className={`ai-settings-toggle ${showAiSettings ? 'active' : ''}`}
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  title="AI Settings"
                >
                  🤖 AI
                </button>
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

            {showAiSettings && (
              <div className="ai-settings-bar">
                <div className="ai-settings-group">
                  <label className="ai-settings-label">Mode</label>
                  <div className="ai-model-pills">
                    {AI_MODELS.map(m => (
                      <button
                        key={m.value}
                        className={`ai-pill ${aiModel === m.value ? 'active' : ''}`}
                        onClick={() => setAiModel(m.value)}
                        title={m.value}
                      >
                        <span className="ai-pill-icon">{m.icon}</span>
                        <span className="ai-pill-label">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ai-settings-group">
                  <label className="ai-settings-label">Personality</label>
                  <div className="ai-personality-toggle">
                    {AI_PERSONALITIES.map(p => (
                      <button
                        key={p.value}
                        className={`ai-personality-btn ${aiMode === p.value ? 'active' : ''}`}
                        onClick={() => setAiMode(p.value)}
                      >
                        <span className="personality-name">{p.label}</span>
                        <span className="personality-desc">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {searchOpen && (
              <div className="search-bar-panel">
                <input
                  className="search-bar-input"
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button className="search-bar-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            )}

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
              searchQuery={searchQuery}
              addToast={addToast}
              showPinnedPanel={showPinnedPanel}
              setShowPinnedPanel={setShowPinnedPanel}
            />
          </main>

          {showCreateGroupModal && (
            <CreateGroupModal setShowModal={setShowCreateGroupModal} />
          )}

          {showMembersPanel && activeChat.isGroup && (
            <GroupMembersPanel
              chat={activeChat}
              onClose={() => setShowMembersPanel(false)}
              onLeave={() => {
                setActiveChat({ id: 'public', name: 'Public Chat' });
                addToast('You left the group', 'info');
              }}
            />
          )}

          {showAdminPanel && (
            <AdminPanel setShowModal={setShowAdminPanel} />
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

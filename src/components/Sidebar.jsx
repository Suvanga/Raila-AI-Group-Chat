import React, { useState } from 'react';
import { db, auth } from '../firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore';

function Sidebar({ user, activeChat, setActiveChat }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // --- Search for users in Firestore ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const usersRef = collection(db, 'users');
    // Create a query to find users whose display name starts with the search term
    const q = query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    try {
      const querySnapshot = await getDocs(q);
      const users = [];
      
      // --- THIS IS THE BUG FIX ---
      // We get the current user's ID *before* the loop
      const myUid = auth.currentUser.uid; 

      querySnapshot.forEach((doc) => {
        // Only add users who are NOT the current user
        if (doc.id !== myUid) { 
          users.push({ id: doc.id, ...doc.data() });
        }
      });
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users: ", error);
    }
  };

  // --- Start a private 1-on-1 chat ---
  const startPrivateChat = (friend) => {
    // Create a unique chat ID by combining both user IDs, sorted
    const myUid = auth.currentUser.uid;
    const theirUid = friend.id;
    const chatId = [myUid, theirUid].sort().join('_');

    // Set this as the active chat in App.jsx
    setActiveChat({
      id: chatId,
      name: friend.displayName
    });
    
    // Clear search
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <nav className="sidebar">
      
      <div className="sidebar-header">
        <h1>Raila AI <span>Chat</span></h1>
      </div>

      {/* --- Public Chat Room --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">Chat Rooms</p>
        <button 
          className={`menu-item ${activeChat.id === 'public' ? 'active' : ''}`}
          onClick={() => setActiveChat({ id: 'public', name: 'Raila AI Group Chat' })}
        >
          #  Public Chat
        </button>
      </div>

      {/* --- AI Bot Section (Future) --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">AI Models</p>
        <button className="menu-item">(Coming Soon)</button>
      </div>

      {/* --- Friends/User Search Section --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">Friends</p>
        <form className="search-bar" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search by display name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* --- Search Results List --- */}
        <div className="user-list">
          {searchResults.map(friend => (
            <button 
              key={friend.id} 
              className="user-list-item"
              onClick={() => startPrivateChat(friend)}
            >
              <img src={friend.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${friend.email}`} alt={friend.displayName} />
              <span>{friend.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- User Profile Footer --- */}
      <div className="sidebar-footer">
        <img src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} alt="Your Avatar" />
        <span>{user.displayName || user.email.split('@')[0]}</span>
      </div>

    </nav>
  );
}

export default Sidebar;
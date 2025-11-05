import React, { useState, useEffect } from 'react'; // <-- Import useEffect
import { db, auth } from '../firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  onSnapshot // <-- Import onSnapshot
} from 'firebase/firestore';

// Add setShowCreateGroupModal prop
function Sidebar({ user, activeChat, setActiveChat, setShowCreateGroupModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupChats, setGroupChats] = useState([]); // <-- State for our new groups

  // --- NEW: Listen for group chats ---
  useEffect(() => {
    const chatsRef = collection(db, 'chats');
    // Query for groups where the current user is a member
    const q = query(chatsRef, where('members', 'array-contains', auth.currentUser.uid));

    // onSnapshot listens for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groups = [];
      querySnapshot.forEach((doc) => {
        // Only add group chats (isGroup: true), not 1-on-1 chats
        if (doc.data().isGroup) {
          groups.push({ id: doc.id, ...doc.data() });
        }
      });
      setGroupChats(groups);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []); // Empty array means this runs once on component mount

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
      where('displayName', '<=', searchTerm + '\uf8ff'), // '\uf8ff' is a magic char for 'starts-with' queries
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      // Don't show the current user in the search results
      if (doc.id !== auth.currentUser.uid) {
        users.push({ uid: doc.id, ...doc.data() });
      }
    });
    setSearchResults(users);
  };

  // --- Start a new 1-on-1 chat ---
  const handleStartPrivateChat = (friend) => {
    // Create a unique chat ID by combining user IDs
    // This ensures that any 1-on-1 chat only has one room
    const currentUserId = auth.currentUser.uid;
    const friendId = friend.uid;
    
    // Sort IDs to ensure consistency (user1_user2 is the same as user2_user1)
    const chatId = currentUserId > friendId 
      ? `${currentUserId}_${friendId}` 
      : `${friendId}_${currentUserId}`;

    // Set this new chat as the active one
    setActiveChat({
      id: chatId,
      name: friend.displayName
    });

    // Clear search results
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <nav className="sidebar">
      
      <div className="sidebar-header">
        <h1>Raila AI <span>Chat</span></h1>
      </div>

      {/* --- CHAT ROOMS SECTION --- */}
      <div className="sidebar-menu-section">
        <div className="menu-title-header">
          <p className="menu-title">Chat Rooms</p>
          <button className="add-group-btn" title="Create Group" onClick={() => setShowCreateGroupModal(true)}>
            +
          </button>
        </div>
        
        {/* Public Chat Button */}
        <button 
          className={`menu-item ${activeChat.id === 'public' ? 'active' : ''}`}
          onClick={() => setActiveChat({ id: 'public', name: 'Public Chat' })}
        >
          # Public Chat
        </button>

        {/* --- List of Group Chats --- */}
        {groupChats.map(group => (
          <button
            key={group.id}
            className={`menu-item ${activeChat.id === group.id ? 'active' : ''}`}
            onClick={() => setActiveChat({ id: group.id, name: group.groupName })}
          >
            # {group.groupName}
          </button>
        ))}
      </div>

      {/* --- AI MODELS SECTION (Coming Soon) --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">AI Models</p>
        <div className="menu-item-disabled">(Coming Soon)</div>
      </div>

      {/* --- FRIENDS (USER SEARCH) SECTION --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">Friends</p>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* --- Search Results --- */}
        <div className="search-results">
          {searchResults.map(friend => (
            <button 
              key={friend.uid} 
              className="user-search-item"
              onClick={() => handleStartPrivateChat(friend)}
            >
              <img src={friend.photoURL} alt={friend.displayName} />
              <span>{friend.displayName}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* --- User Profile Section --- */}
      <div className="sidebar-user-info">
        <img src={user.photoURL} alt="Your avatar" />
        <span>{user.displayName}</span>
      </div>
    </nav>
  );
}

export default Sidebar;
import React, { useState, useMemo } from 'react';
import { db, auth, functions } from '../firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc,
  setDoc,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useChatList } from '../hooks/useChatList.js';
import { useUnread } from '../hooks/useUnread.js';
import { useUserPresence } from '../hooks/usePresence.js';

function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Offline';
  const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PresenceDot({ uid, showLabel }) {
  const { online, lastSeen } = useUserPresence(uid);
  const tooltip = online ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`;
  return (
    <>
      <span
        className={`presence-dot ${online ? 'online' : 'offline'}`}
        title={tooltip}
      />
      {showLabel && !online && lastSeen && (
        <span className="last-seen-label">{formatLastSeen(lastSeen)}</span>
      )}
    </>
  );
}

function Sidebar({ user, activeChat, setActiveChat, setShowCreateGroupModal, isOpen, userRole, setShowAdminPanel }) {
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { groupChats, dmChats } = useChatList();

  // Build a flat list of all chat IDs for unread tracking
  const allChatIds = useMemo(() => {
    const ids = ['public'];
    groupChats.forEach((g) => ids.push(g.id));
    dmChats.forEach((d) => ids.push(d.id));
    return ids;
  }, [groupChats, dmChats]);

  const { unreadCounts, markAsRead } = useUnread(allChatIds, activeChat.id);

  // Search for users in Firestore
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== auth.currentUser.uid) {
        users.push({ uid: docSnap.id, ...docSnap.data() });
      }
    });
    setSearchResults(users);
  };

  // Start or open a 1-on-1 DM — persists the chat doc in Firestore
  const handleStartPrivateChat = async (friend) => {
    const currentUserId = auth.currentUser.uid;
    const friendId = friend.uid;
    
    // Deterministic chat ID so the same pair always maps to the same doc
    const chatId = currentUserId > friendId 
      ? `${currentUserId}_${friendId}` 
      : `${friendId}_${currentUserId}`;

    // Create the DM doc in Firestore if it doesn't exist yet
    const chatDocRef = doc(db, 'chats', chatId);
    const chatDocSnap = await getDoc(chatDocRef);

    if (!chatDocSnap.exists()) {
      const { uid, displayName, photoURL } = auth.currentUser;
      await setDoc(chatDocRef, {
        isDM: true,
        isGroup: false,
        members: [currentUserId, friendId],
        membersInfo: [
          { uid, displayName, photoURL },
          { uid: friend.uid, displayName: friend.displayName, photoURL: friend.photoURL },
        ],
        createdAt: serverTimestamp(),
      });
    }

    setActiveChat({
      id: chatId,
      name: friend.displayName
    });

    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      
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
          <span># Public Chat</span>
          {unreadCounts['public'] > 0 && (
            <span className="unread-badge">{unreadCounts['public']}</span>
          )}
        </button>

        {/* --- List of Group Chats --- */}
        {groupChats.map(group => (
          <button
            key={group.id}
            className={`menu-item ${activeChat.id === group.id ? 'active' : ''}`}
            onClick={() => setActiveChat({ id: group.id, name: group.groupName, isGroup: true, members: group.members, membersInfo: group.membersInfo })}
          >
            <span># {group.groupName}</span>
            {unreadCounts[group.id] > 0 && (
              <span className="unread-badge">{unreadCounts[group.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* --- DIRECT MESSAGES SECTION --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">Direct Messages</p>
        {dmChats.length === 0 && (
          <div className="menu-item-disabled">No conversations yet</div>
        )}
        {dmChats.map(dm => {
          const otherUid = dm.members?.find(m => m !== auth.currentUser?.uid);
          return (
            <button
              key={dm.id}
              className={`menu-item dm-item ${activeChat.id === dm.id ? 'active' : ''}`}
              onClick={() => setActiveChat({ id: dm.id, name: dm.displayName })}
            >
              <div className="dm-avatar-wrapper">
                <img 
                  className="dm-avatar" 
                  src={dm.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${dm.displayName}`} 
                  alt={dm.displayName} 
                />
                {otherUid && <PresenceDot uid={otherUid} showLabel />}
              </div>
              <span className="dm-name">{dm.displayName}</span>
              {unreadCounts[dm.id] > 0 && (
                <span className="unread-badge">{unreadCounts[dm.id]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* --- FRIENDS (USER SEARCH) SECTION --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">Find People</p>
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
      
      {/* --- Invite & Admin Section --- */}
      <div className="sidebar-menu-section">
        <p className="menu-title">Invite Friends</p>
        {generatedCode ? (
          <div className="invite-code-result">
            <code className="invite-code-display">{generatedCode}</code>
            <button
              className="invite-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
              }}
            >
              Copy
            </button>
          </div>
        ) : (
          <button
            className="menu-item invite-generate-btn"
            onClick={async () => {
              setInviteLoading(true);
              try {
                const createInviteCode = httpsCallable(functions, 'createInviteCode');
                const result = await createInviteCode({ maxUses: 5, expiresInDays: 7 });
                setGeneratedCode(result.data?.code);
              } catch (err) {
                console.error('Invite create error:', err);
              } finally {
                setInviteLoading(false);
              }
            }}
            disabled={inviteLoading}
          >
            {inviteLoading ? 'Generating...' : '+ Generate Invite Code'}
          </button>
        )}

        {userRole === 'admin' && (
          <button
            className="menu-item admin-btn"
            onClick={() => setShowAdminPanel(true)}
          >
            Admin Panel
          </button>
        )}
      </div>

      <div className="sidebar-user-info">
        <div className="dm-avatar-wrapper sidebar-avatar-wrapper">
          <img src={user.photoURL} alt="Your avatar" />
          <span className="presence-dot online" title="Online" />
        </div>
        <span>{user.displayName}</span>
      </div>
    </nav>
  );
}

export default Sidebar;
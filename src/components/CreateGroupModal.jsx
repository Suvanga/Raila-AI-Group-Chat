import React, { useState } from 'react';
import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';

// This component is the popup for creating a new group
function CreateGroupModal({ setShowModal }) {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // --- Search for users to add ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const usersRef = collection(db, 'users');
    // Find users whose name starts with the search term
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

  // --- Add or remove a user from the selected list ---
  const toggleMember = (user) => {
    // Check if user is already selected
    if (selectedMembers.find(member => member.uid === user.uid)) {
      // If yes, remove them
      setSelectedMembers(selectedMembers.filter(member => member.uid !== user.uid));
    } else {
      // If no, add them
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  // --- Create the new group chat ---
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please name your group and select at least one member.');
      return;
    }

    // Get current user's info to add to the group
    const { uid, displayName, photoURL } = auth.currentUser;
    
    // Create a list of all member UIDs (for security rules)
    const memberIds = [uid, ...selectedMembers.map(m => m.uid)];
    
    // Create a list of all member info (for display)
    const membersInfo = [
      { uid, displayName, photoURL },
      ...selectedMembers.map(m => ({ uid: m.uid, displayName: m.displayName, photoURL: m.photoURL }))
    ];

    try {
      // Add a new document to the 'chats' collection
      await addDoc(collection(db, 'chats'), {
        groupName: groupName,
        members: memberIds,       // Array of UIDs
        membersInfo: membersInfo,   // Array of objects
        createdBy: uid,
        createdAt: serverTimestamp(),
        isGroup: true             // Mark this as a group chat
      });

      setShowModal(false); // Close the modal on success
      
    } catch (error) {
      console.error("Error creating group: ", error);
      alert(`Error creating group: ${error.message}`);
    }
  };


  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
        
        <h2>Create New Group Chat</h2>

        {/* --- Group Name Input --- */}
        <input
          type="text"
          className="modal-input"
          placeholder="Enter group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        {/* --- Member Search --- */}
        <form onSubmit={handleSearch} className="modal-search-form">
          <input
            type="text"
            className="modal-input"
            placeholder="Search for members by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {/* --- Search Results --- */}
        <div className="modal-user-list">
          {searchResults.map(user => (
            <div 
              key={user.uid} 
              className="user-item" 
              onClick={() => toggleMember(user)}
            >
              <img src={user.photoURL} alt={user.displayName} />
              <p>{user.displayName}</p>
              {selectedMembers.find(m => m.uid === user.uid) && <span>✔</span>}
            </div>
          ))}
        </div>

        {/* --- Selected Members --- */}
        <div className="selected-members">
          <p>Selected:</p>
          <div className="members-pills">
            {selectedMembers.map(member => (
              <span key={member.uid} className="member-pill" onClick={() => toggleMember(member)}>
                {member.displayName} &times;
              </span>
            ))}
          </div>
        </div>
        
        {/* --- Create Button --- */}
        <button 
          className="modal-create-btn" 
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedMembers.length === 0}
        >
          Create Group
        </button>
      </div>
    </div>
  );
}

export default CreateGroupModal;
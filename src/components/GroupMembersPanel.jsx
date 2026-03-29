import React from 'react';
import { auth, db } from '../firebase-config.js';
import { doc, updateDoc } from 'firebase/firestore';
import { useUserPresence } from '../hooks/usePresence.js';

function MemberRow({ member }) {
  const { online } = useUserPresence(member.uid);
  const isCurrentUser = member.uid === auth.currentUser?.uid;

  return (
    <div className="member-row">
      <div className="member-avatar-wrapper">
        <img
          className="member-avatar"
          src={member.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${member.displayName}`}
          alt={member.displayName}
        />
        <span className={`presence-dot ${online ? 'online' : 'offline'}`} />
      </div>
      <span className="member-name">
        {member.displayName}{isCurrentUser ? ' (you)' : ''}
      </span>
      <span className={`member-status ${online ? 'online' : ''}`}>
        {online ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

function GroupMembersPanel({ chat, onClose, onLeave }) {
  const members = chat.membersInfo || [];
  const currentUid = auth.currentUser?.uid;
  const isMember = chat.members?.includes(currentUid);

  const handleLeaveGroup = async () => {
    if (!window.confirm(`Leave "${chat.name}"? You won't see this group anymore.`)) return;
    try {
      const chatRef = doc(db, 'chats', chat.id);
      const remainingMembers = (chat.members || []).filter((memberUid) => memberUid !== currentUid);
      const remainingMembersInfo = members.filter((member) => member.uid !== currentUid);
      await updateDoc(chatRef, {
        members: remainingMembers,
        membersInfo: remainingMembersInfo,
      });
      onLeave?.();
      onClose();
    } catch (err) {
      console.error('Leave group error:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content members-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Members ({members.length})</h2>

        <div className="members-list">
          {members.map(m => (
            <MemberRow key={m.uid} member={m} />
          ))}
        </div>

        {isMember && (
          <button className="leave-group-btn" onClick={handleLeaveGroup}>
            Leave Group
          </button>
        )}
      </div>
    </div>
  );
}

export default GroupMembersPanel;

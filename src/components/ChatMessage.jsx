import React from 'react';
import { auth } from '../firebase-config.js';

function ChatMessage(props) {
  const { text, uid, photoURL, email, createdAt } = props.message;

  // --- THIS IS THE UPDATED LOGIC ---
  // It now checks for the AI bot, 'sent' messages, or 'received' messages
  let messageClass = '';
  if (uid === 'RailaAI') {
    messageClass = 'ai';
  } else if (uid === auth.currentUser.uid) {
    messageClass = 'sent';
  } else {
    messageClass = 'received';
  }
  
  const displayName = uid === 'RailaAI' 
    ? 'RailaAI' 
    : (email ? email.split('@')[0] : 'User');
  
  // Use a default avatar if photoURL is missing (DiceBear is a great placeholder)
  const avatar = photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`;

  // Format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
      ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-wrapper ${messageClass}`}>
      <img 
        className="message-avatar" 
        src={avatar} 
        alt={displayName} 
        title={email} 
      />
      <div className="message-content">
        <div className="message-meta">
          <span className="message-sender">{displayName}</span>
          <span className="message-time">{formatTime(createdAt)}</span>
        </div>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default ChatMessage;
import React from 'react';
import { auth } from '../firebase-config.js';

function ChatMessage(props) {
  const { text, uid, photoURL, email } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  const displayName = email.split('@')[0];

  // Fallback avatar
  const avatar = photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`;

  return (
    <div className={`message-wrapper ${messageClass}`}>
      <img 
        className="message-avatar" 
        src={avatar} 
        alt={displayName} 
        title={email} 
      />
      <div className="message-content">
        <p>{text}</p>
      </div>
    </div>
  );
}

export default ChatMessage;

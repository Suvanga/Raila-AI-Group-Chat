import React from 'react';
import { auth } from '../firebase-config.js';

function ChatMessage(props) {
  const { text, uid, photoURL, email } = props.message;

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
  
  const displayName = email ? email.split('@')[0] : 'User';
  
  // Use a default avatar if photoURL is missing (DiceBear is a great placeholder)
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
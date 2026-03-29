import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { auth, db } from '../firebase-config.js';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👀', '🎉'];

function highlightText(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
}

function ChatMessage({ message, collectionPath, onReply, highlight, onToast, onPin }) {
  const { id, text, uid, photoURL, email, createdAt, reactions, replyTo, fileURL, fileName, fileType, isImage, pinned } = message;
  const currentUid = auth.currentUser.uid;

  let messageClass = '';
  if (uid === 'RailaAI') {
    messageClass = 'ai';
  } else if (uid === currentUid) {
    messageClass = 'sent';
  } else {
    messageClass = 'received';
  }
  
  const displayName = uid === 'RailaAI' 
    ? 'RailaAI' 
    : (email ? email.split('@')[0] : 'User');
  
  const avatar = photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`;
  const isAi = uid === 'RailaAI';

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

  const toggleReaction = async (emoji) => {
    if (!collectionPath || !id) return;
    const msgRef = doc(db, collectionPath, id);
    const reactionKey = `reactions.${emoji}`;

    const currentReactions = reactions?.[emoji] || [];
    if (currentReactions.includes(currentUid)) {
      await updateDoc(msgRef, { [reactionKey]: arrayRemove(currentUid) });
    } else {
      await updateDoc(msgRef, { [reactionKey]: arrayUnion(currentUid) });
    }
  };

  const handlePin = async () => {
    if (!collectionPath || !id) return;
    try {
      const msgRef = doc(db, collectionPath, id);
      await updateDoc(msgRef, { pinned: !pinned });
      onToast?.(pinned ? 'Message unpinned' : 'Message pinned', 'success');
    } catch (err) {
      console.error('Pin error:', err);
      onToast?.('Failed to pin message', 'error');
    }
  };

  const handleDelete = async () => {
    if (!collectionPath || !id) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteDoc(doc(db, collectionPath, id));
      onToast?.('Message deleted');
    } catch (err) {
      console.error('Delete error:', err);
      onToast?.('Failed to delete message');
    }
  };

  const isOwnMessage = uid === currentUid;
  const reactionEntries = reactions ? Object.entries(reactions).filter(([, uids]) => uids.length > 0) : [];

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
          {pinned && <span className="pinned-badge" title="Pinned">📌</span>}
        </div>

        {replyTo && (
          <div className="reply-quote-inline">
            <span className="reply-quote-sender">{replyTo.senderName}</span>
            <span className="reply-quote-text">{replyTo.text?.slice(0, 80)}{replyTo.text?.length > 80 ? '...' : ''}</span>
          </div>
        )}

        {isAi ? (
          <div className={`message-markdown ${highlight ? 'search-match' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        ) : text ? (
          <p className={highlight ? 'search-match' : ''}>{highlight ? highlightText(text, highlight) : text}</p>
        ) : null}

        {isImage && fileURL && (
          <a href={fileURL} target="_blank" rel="noopener noreferrer" className="message-image-link">
            <img src={fileURL} alt={fileName || 'image'} className="message-image" />
          </a>
        )}

        {!isImage && fileURL && (
          <a href={fileURL} target="_blank" rel="noopener noreferrer" className="message-file-link">
            <span className="file-icon">📄</span>
            <span className="file-name">{fileName || 'Download file'}</span>
          </a>
        )}

        {reactionEntries.length > 0 && (
          <div className="reaction-badges">
            {reactionEntries.map(([emoji, uids]) => (
              <button
                key={emoji}
                className={`reaction-badge ${uids.includes(currentUid) ? 'active' : ''}`}
                onClick={() => toggleReaction(emoji)}
                title={uids.length + ' reaction(s)'}
              >
                {emoji} {uids.length}
              </button>
            ))}
          </div>
        )}

        <div className="message-actions">
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              className="action-btn reaction-quick"
              onClick={() => toggleReaction(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
          {onReply && (
            <button
              className="action-btn reply-btn-action"
              onClick={() => onReply(message)}
              title="Reply"
            >
              ↩
            </button>
          )}
          <button
            className="action-btn pin-btn-action"
            onClick={handlePin}
            title={pinned ? 'Unpin' : 'Pin'}
          >
            {pinned ? '📌' : '📍'}
          </button>
          {isOwnMessage && (
            <button
              className="action-btn delete-btn-action"
              onClick={handleDelete}
              title="Delete message"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
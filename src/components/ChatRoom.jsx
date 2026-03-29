import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { db, auth, functions, storage } from '../firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ChatMessage from './ChatMessage.jsx';
import Picker from 'emoji-picker-react';
import { useMessages } from '../hooks/useMessages.js';
import { useTypingIndicator, useTypingUsers } from '../hooks/usePresence.js';
import { useNotificationSound } from '../hooks/useNotificationSound.js';

const SLASH_COMMANDS = [
  { cmd: '/trip', model: 'Trip Planner', label: 'Plan a trip', icon: '✈️' },
  { cmd: '/homework', model: 'Homework Help', label: 'Get homework help', icon: '📚' },
  { cmd: '/budget', model: 'Budgeting', label: 'Budget & finance advice', icon: '💰' },
  { cmd: '/date', model: 'Date Planner', label: 'Plan a date', icon: '❤️' },
  { cmd: '/ask', model: 'Generic', label: 'Ask anything', icon: '💬' },
];

function ChatRoom({ chatId, chatName, aiModel, aiMode, searchQuery, addToast, showPinnedPanel, setShowPinnedPanel }) {
  const [formValue, setFormValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  const {
    messages,
    loading,
    syncing,
    error,
    messagesEndRef,
    messagesCollectionPath,
    hasMore,
    loadMore,
    loadingMore,
  } = useMessages(chatId);
  const { setTyping } = useTypingIndicator(chatId);
  const typingUsers = useTypingUsers(chatId);
  const playNotification = useNotificationSound();
  const pinnedMessages = useMemo(() => messages.filter(m => m.pinned), [messages]);
  const showLoadingState = loading && messages.length === 0;
  const showEmptyState = !error && messages.length === 0 && !showLoadingState;

  const checkIfNearBottom = useCallback(() => {
    const el = messageListRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    isNearBottomRef.current = nearBottom;
    if (nearBottom) setShowNewMsgPill(false);
  }, [checkIfNearBottom]);

  useEffect(() => {
    if (messages.length === 0) return;
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (!isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const isFromOther = lastMsg?.uid !== auth.currentUser?.uid;

    if (isFromOther && prevMessageCountRef.current > 1) {
      playNotification();
    }

    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isFromOther) {
      setShowNewMsgPill(true);
    }
  }, [messages, messagesEndRef]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMsgPill(false);
  }, [messagesEndRef]);

  const filteredCommands = useMemo(() => {
    if (!slashFilter) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(c => c.cmd.startsWith(slashFilter));
  }, [slashFilter]);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setFormValue(val);

    if (val.startsWith('/') && !val.includes(' ')) {
      setShowSlashMenu(true);
      setSlashFilter(val.toLowerCase());
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }

    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  }, [setTyping]);

  const handleSlashSelect = (cmd) => {
    setFormValue(cmd.cmd + ' ');
    setShowSlashMenu(false);
    setSlashFilter('');
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiObject) => {
    setFormValue(prevInput => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  const postAiMessage = async (text) => {
    const messagesRef = collection(db, messagesCollectionPath);
    await addDoc(messagesRef, {
      text: text,
      createdAt: serverTimestamp(),
      uid: "RailaAI",
      email: "bot@raila.ai",
      photoURL: "https://api.dicebear.com/8.x/bottts/svg?seed=RailaAI"
    });
  };

  const getAiResponse = async (userMessage, overrideModel) => {
    setIsAiTyping(true);

    const history = messages.slice(-10).map(m => ({
      role: m.uid === 'RailaAI' ? 'model' : 'user',
      text: m.text,
      sender: m.uid === 'RailaAI' ? 'RailaAI' : (m.email?.split('@')[0] || 'User'),
    }));

    try {
      const generateAiResponse = httpsCallable(functions, 'generateAiResponse');
      const result = await generateAiResponse({
        message: userMessage,
        aiModel: overrideModel || aiModel || 'Generic',
        aiMode: aiMode || 'Sushil',
        history,
      });

      if (result.data?.text) {
        await postAiMessage(result.data.text);
      } else {
        await postAiMessage("Sorry, I had trouble thinking of a response.");
      }
    } catch (err) {
      console.error("AI Cloud Function Error:", err);
      await postAiMessage("Sorry, I'm having connection issues. Please try again.");
    } finally {
      setIsAiTyping(false);
    }
  };

  const parseSlashCommand = (text) => {
    const match = SLASH_COMMANDS.find(c => text.toLowerCase().startsWith(c.cmd + ' ') || text.toLowerCase() === c.cmd);
    if (match) {
      const userMsg = text.slice(match.cmd.length).trim() || match.label;
      return { model: match.model, message: userMsg };
    }
    return null;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = formValue.trim();
    if (!messageText) return;

    const { uid, photoURL, email } = auth.currentUser;
    const messagesRef = collection(db, messagesCollectionPath);

    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setFormValue('');
    setShowSlashMenu(false);

    const currentReply = replyingTo;
    setReplyingTo(null);

    const slashCmd = parseSlashCommand(messageText);

    const msgData = {
      text: messageText,
      createdAt: serverTimestamp(),
      uid,
      email,
      photoURL: photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`
    };

    if (currentReply) {
      msgData.replyTo = {
        messageId: currentReply.id,
        text: currentReply.text,
        senderName: currentReply.uid === 'RailaAI' ? 'RailaAI' : (currentReply.email?.split('@')[0] || 'User'),
      };
    }

    try {
      await addDoc(messagesRef, msgData);

      if (slashCmd) {
        getAiResponse(slashCmd.message, slashCmd.model);
      } else if (messageText.toLowerCase().includes('@railaai')) {
        getAiResponse(messageText);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setFormValue(messageText);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast?.('File too large. Max 10MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const { uid, photoURL, email } = auth.currentUser;
      const timestamp = Date.now();
      const storageRef = ref(storage, `chat-files/${chatId}/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const isImage = file.type.startsWith('image/');
      const messagesRef = collection(db, messagesCollectionPath);

      await addDoc(messagesRef, {
        text: isImage ? '' : `📎 ${file.name}`,
        createdAt: serverTimestamp(),
        uid,
        email,
        photoURL: photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`,
        fileURL: downloadURL,
        fileName: file.name,
        fileType: file.type,
        isImage,
      });
    } catch (err) {
      console.error("File upload error:", err);
      addToast?.('Failed to upload file. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDateSeparator = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getDateKey = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toDateString();
  };

  const renderMessagesWithDates = () => {
    const elements = [];
    let lastDateKey = null;

    for (const msg of messages) {
      const dateKey = getDateKey(msg.createdAt);
      if (dateKey && dateKey !== lastDateKey) {
        elements.push(
          <div key={`date-${dateKey}`} className="date-separator">
            <span>{formatDateSeparator(msg.createdAt)}</span>
          </div>
        );
        lastDateKey = dateKey;
      }
      const isMatch = searchQuery && msg.text?.toLowerCase().includes(searchQuery.toLowerCase());
      elements.push(
        <ChatMessage
          key={msg.id}
          message={msg}
          collectionPath={messagesCollectionPath}
          onReply={setReplyingTo}
          highlight={isMatch ? searchQuery : null}
          onToast={addToast}
        />
      );
    }
    return elements;
  };

  const typingStatusText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].displayName} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing...`;
    return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing...`;
  };

  return (
    <main className="chat-room">
      {/* --- Chat Header --- */}
      <div className="chat-room-header">
        <h2>{chatName}</h2>
      </div>

      {/* --- Pinned Messages Panel --- */}
      {showPinnedPanel && (
        <div className="pinned-panel">
          <div className="pinned-panel-header">
            <span>📌 Pinned Messages ({pinnedMessages.length})</span>
            <button className="pinned-panel-close" onClick={() => setShowPinnedPanel(false)}>✕</button>
          </div>
          <div className="pinned-panel-body">
            {pinnedMessages.length === 0 ? (
              <p className="pinned-empty">No pinned messages yet</p>
            ) : (
              pinnedMessages.map(msg => (
                <div key={msg.id} className="pinned-item">
                  <span className="pinned-item-sender">
                    {msg.uid === 'RailaAI' ? 'RailaAI' : (msg.email?.split('@')[0] || 'User')}
                  </span>
                  <span className="pinned-item-text">{msg.text?.slice(0, 120)}{msg.text?.length > 120 ? '...' : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- Message List --- */}
      <div className="message-list" ref={messageListRef} onScroll={handleScroll}>
        {/* Loading state */}
        {showLoadingState && (
          <div className="chat-status">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="chat-status chat-error">
            <p>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {showEmptyState && (
          <div className="chat-status">
            <p className="chat-empty">No messages yet. Say hello!</p>
            {syncing && (
              <p className="chat-syncing">Still syncing the room in the background...</p>
            )}
          </div>
        )}

        {hasMore && (
          <div className="load-more-container">
            <button
              className="load-more-btn"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {renderMessagesWithDates()}
        
        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="message-wrapper ai">
            <img 
              className="message-avatar"
              src="https://api.dicebear.com/8.x/bottts/svg?seed=RailaAI" 
              alt="RailaAI" 
            />
            <div className="message-content">
              <div className="message-meta">
                <span className="message-sender">RailaAI</span>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <span ref={messagesEndRef}></span>
      </div>

      {/* --- New Messages Pill --- */}
      {showNewMsgPill && (
        <button className="new-messages-pill" onClick={scrollToBottom}>
          ↓ New messages
        </button>
      )}

      {/* --- Typing status bar --- */}
      {typingStatusText() && (
        <div className="typing-status-bar">
          <div className="typing-indicator typing-indicator-sm">
            <span></span><span></span><span></span>
          </div>
          <span>{typingStatusText()}</span>
        </div>
      )}

      {/* --- Reply Bar --- */}
      {replyingTo && (
        <div className="reply-bar">
          <div className="reply-bar-content">
            <span className="reply-bar-label">Replying to </span>
            <span className="reply-bar-sender">
              {replyingTo.uid === 'RailaAI' ? 'RailaAI' : (replyingTo.email?.split('@')[0] || 'User')}
            </span>
            <span className="reply-bar-text">{replyingTo.text?.slice(0, 60)}{replyingTo.text?.length > 60 ? '...' : ''}</span>
          </div>
          <button className="reply-bar-close" onClick={() => setReplyingTo(null)}>✕</button>
        </div>
      )}

      {/* --- Send Form --- */}
      <form className="send-form" onSubmit={sendMessage}>
        {showPicker && (
          <div className="emoji-picker-container">
            <Picker 
              onEmojiClick={onEmojiClick}
              theme="dark"
              skinTonesDisabled
              emojiStyle="google"
            />
          </div>
        )}

        {showSlashMenu && filteredCommands.length > 0 && (
          <div className="slash-menu">
            {filteredCommands.map(cmd => (
              <button
                key={cmd.cmd}
                type="button"
                className="slash-menu-item"
                onClick={() => handleSlashSelect(cmd)}
              >
                <span className="slash-menu-icon">{cmd.icon}</span>
                <span className="slash-menu-cmd">{cmd.cmd}</span>
                <span className="slash-menu-desc">{cmd.label}</span>
              </button>
            ))}
          </div>
        )}
        
        <button 
          type="button" 
          className="emoji-btn" 
          onClick={() => setShowPicker(!showPicker)}
        >
          😊
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />
        <button
          type="button"
          className="emoji-btn file-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach file"
        >
          {uploading ? '⏳' : '📎'}
        </button>

        <input
          ref={inputRef}
          value={formValue}
          onChange={handleInputChange}
          placeholder={`Message #${chatName} — try /trip, /homework, or @RailaAI`}
          onClick={() => setShowPicker(false)}
        />
        <button type="submit" disabled={!formValue.trim() && !uploading}>
          Send
        </button>
      </form>
    </main>
  );
}

export default ChatRoom;

import React, { useState, useRef, useCallback } from 'react';
import { db, auth, functions } from '../firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import ChatMessage from './ChatMessage.jsx';
import Picker from 'emoji-picker-react';
import { useMessages } from '../hooks/useMessages.js';
import { useTypingIndicator, useTypingUsers } from '../hooks/usePresence.js';

function ChatRoom({ chatId, chatName, aiModel, aiMode }) {
  const [formValue, setFormValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Custom hooks
  const { messages, loading, error, messagesEndRef, messagesCollectionPath } = useMessages(chatId);
  const { setTyping } = useTypingIndicator(chatId);
  const typingUsers = useTypingUsers(chatId);

  // Handle typing indicator debounce
  const handleInputChange = useCallback((e) => {
    setFormValue(e.target.value);

    // Signal typing
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  }, [setTyping]);

  const onEmojiClick = (emojiObject) => {
    setFormValue(prevInput => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  // Post AI message to Firestore
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

  // Call AI via Firebase Cloud Function (API key stays server-side)
  const getAiResponse = async (userMessage) => {
    setIsAiTyping(true);

    try {
      const generateAiResponse = httpsCallable(functions, 'generateAiResponse');
      const result = await generateAiResponse({
        message: userMessage,
        aiModel: aiModel || 'Generic',
        aiMode: aiMode || 'Sushil',
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

  // Send Message
  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = formValue;
    if (!messageText.trim()) return;

    const { uid, photoURL, email } = auth.currentUser;
    const messagesRef = collection(db, messagesCollectionPath);

    // Clear typing indicator immediately
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      await addDoc(messagesRef, {
        text: messageText,
        createdAt: serverTimestamp(),
        uid,
        email,
        photoURL: photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`
      });
      setFormValue('');

      // Check if AI was mentioned
      if (messageText.toLowerCase().includes('@railaai')) {
        getAiResponse(messageText);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Build typing status text
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

      {/* --- Message List --- */}
      <div className="message-list">
        {/* Loading state */}
        {loading && (
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
        {!loading && !error && messages.length === 0 && (
          <div className="chat-status">
            <p className="chat-empty">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        
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

      {/* --- Typing status bar --- */}
      {typingStatusText() && (
        <div className="typing-status-bar">
          <div className="typing-indicator typing-indicator-sm">
            <span></span><span></span><span></span>
          </div>
          <span>{typingStatusText()}</span>
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
        
        <button 
          type="button" 
          className="emoji-btn" 
          onClick={() => setShowPicker(!showPicker)}
        >
          😊
        </button>

        <input
          value={formValue}
          onChange={handleInputChange}
          placeholder={`Message #${chatName} (try @RailaAI)`}
          onClick={() => setShowPicker(false)}
        />
        <button type="submit" disabled={!formValue.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}

export default ChatRoom;
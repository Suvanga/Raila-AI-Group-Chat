import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import ChatMessage from './ChatMessage.jsx';

// This component is now dynamic.
// It shows messages based on the 'chatId' prop it receives.
function ChatRoom({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');
  const messagesEndRef = useRef(null); // For auto-scrolling
  
  // This is the magic. The path to the messages collection is now dynamic.
  // For 'public', it's 'messages'.
  // For a private chat, it's 'chats/USER1_USER2/messages'
  const messagesCollectionPath = chatId === 'public' 
    ? 'messages' // Path for public chat
    : `chats/${chatId}/messages`; // Path for private chats
    
  const messagesRef = collection(db, messagesCollectionPath);

  // Listen for new messages in the currently active chat room
  useEffect(() => {
    // Create a query to get messages, ordered by time
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // onSnapshot creates the real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    // When the chatId changes (e.g., user clicks a friend),
    // this effect will re-run and subscribe to the new chat room.
    return () => unsubscribe();
  }, [chatId]); // <-- Re-run this hook when chatId changes!

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    const { uid, photoURL, email } = auth.currentUser;

    try {
      // Add the message to the currently active collection
      await addDoc(messagesRef, {
        text: formValue,
        createdAt: serverTimestamp(),
        uid,
        email,
        photoURL: photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`
      });
      setFormValue(''); // Clear the input
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <div className="chat-room">
      <main className="message-list">
        {/* Show a placeholder if the chat is empty */}
        {messages.length === 0 && (
          <div className="chat-placeholder">
            <p>No messages yet. Be the first to say hi!</p>
          </div>
        )}
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        {/* This is an invisible element to help scrolling */}
        <span ref={messagesEndRef}></span>
      </main>

      {/* --- Dynamic Placeholder Text --- */}
      <form className="send-form" onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={chatId === 'public' ? 'Message #public' : 'Send a private message...'}
        />
        <button type="submit" disabled={!formValue.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;
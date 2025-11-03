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

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');
  const messagesEndRef = useRef(null);
  const messagesRef = collection(db, 'messages');

  // Listen for new messages
  useEffect(() => {
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    const { uid, photoURL, email } = auth.currentUser;

    try {
      await addDoc(messagesRef, {
        text: formValue,
        createdAt: serverTimestamp(),
        uid,
        email,
        photoURL
      });
      setFormValue('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <div className="chat-room">
      <main className="message-list">
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={messagesEndRef}></span>
      </main>

      <form className="send-form" onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!formValue.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;

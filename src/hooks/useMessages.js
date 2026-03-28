import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

export function useMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const messagesCollectionPath = chatId === 'public'
    ? 'messages'
    : `chats/${chatId}/messages`;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMessages([]);

    const messagesRef = collection(db, messagesCollectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error('Messages subscription error:', err);
        setError('Failed to load messages.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, messagesCollectionPath]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return { messages, loading, error, messagesEndRef, messagesCollectionPath };
}

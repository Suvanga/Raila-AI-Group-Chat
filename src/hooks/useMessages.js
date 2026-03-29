import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

const EMPTY_STATE_FALLBACK_DELAY_MS = 1200;

export function useMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const messagesCollectionPath = chatId === 'public'
    ? 'messages'
    : `chats/${chatId}/messages`;

  useEffect(() => {
    let receivedFirstSnapshot = false;

    setLoading(true);
    setSyncing(false);
    setError(null);
    setMessages([]);

    const messagesRef = collection(db, messagesCollectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const emptyStateFallbackTimer = window.setTimeout(() => {
      if (!receivedFirstSnapshot) {
        setLoading(false);
        setSyncing(true);
      }
    }, EMPTY_STATE_FALLBACK_DELAY_MS);

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (querySnapshot) => {
        receivedFirstSnapshot = true;
        window.clearTimeout(emptyStateFallbackTimer);
        const msgs = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
        setLoading(false);
        setSyncing(querySnapshot.metadata.fromCache);
      },
      (err) => {
        window.clearTimeout(emptyStateFallbackTimer);
        console.error('Messages subscription error:', err);
        setError('Failed to load messages.');
        setLoading(false);
        setSyncing(false);
      }
    );

    return () => {
      window.clearTimeout(emptyStateFallbackTimer);
      unsubscribe();
    };
  }, [messagesCollectionPath]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messages,
    loading,
    syncing,
    error,
    messagesEndRef,
    messagesCollectionPath,
  };
}

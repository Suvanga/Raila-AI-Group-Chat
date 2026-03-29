import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase-config.js';
import {
  collection,
  query,
  orderBy,
  limitToLast,
  onSnapshot,
  getDocs,
  endBefore,
} from 'firebase/firestore';

const EMPTY_STATE_FALLBACK_DELAY_MS = 1200;
const PAGE_SIZE = 50;

export function useMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [olderMessages, setOlderMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
    setOlderMessages([]);
    setHasMore(false);

    const messagesRef = collection(db, messagesCollectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(PAGE_SIZE));
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
        setHasMore(msgs.length >= PAGE_SIZE);
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

  const loadMore = useCallback(async () => {
    const allMsgs = [...olderMessages, ...messages];
    if (allMsgs.length === 0 || loadingMore) return;

    setLoadingMore(true);
    try {
      const oldest = allMsgs[0];
      const messagesRef = collection(db, messagesCollectionPath);
      const q = query(
        messagesRef,
        orderBy('createdAt', 'asc'),
        endBefore(oldest.createdAt),
        limitToLast(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const older = [];
      snapshot.forEach((doc) => {
        older.push({ id: doc.id, ...doc.data() });
      });
      setOlderMessages(prev => [...older, ...prev]);
      setHasMore(older.length >= PAGE_SIZE);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [messages, olderMessages, messagesCollectionPath, loadingMore]);

  const allMessages = [...olderMessages, ...messages];

  return {
    messages: allMessages,
    loading,
    syncing,
    error,
    messagesEndRef,
    messagesCollectionPath,
    hasMore,
    loadMore,
    loadingMore,
  };
}

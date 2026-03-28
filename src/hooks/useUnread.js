import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase-config.js';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Tracks unread message counts per chat.
 *
 * Firestore schema:
 *   users/{uid}/lastRead/{chatId} → { timestamp, messageId }
 *
 * The hook compares each chat's latest message timestamp against the
 * user's lastRead timestamp to compute unread counts.
 */
export function useUnread(chatIds, activeChatId) {
  const [unreadCounts, setUnreadCounts] = useState({});

  // Mark a chat as read — called when user opens a chat
  const markAsRead = useCallback((chatId) => {
    const user = auth.currentUser;
    if (!user || !chatId) return;

    const lastReadRef = doc(db, `users/${user.uid}/lastRead`, chatId);
    setDoc(lastReadRef, {
      timestamp: serverTimestamp(),
    }, { merge: true });

    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  }, []);

  // Auto-mark active chat as read
  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, markAsRead]);

  // Subscribe to latest message in each chat and compare with lastRead
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !chatIds || chatIds.length === 0) return;

    const unsubscribes = [];

    chatIds.forEach((chatId) => {
      // Listen to user's lastRead for this chat
      const lastReadRef = doc(db, `users/${user.uid}/lastRead`, chatId);
      let lastReadTimestamp = null;

      const unsubLastRead = onSnapshot(lastReadRef, (docSnap) => {
        if (docSnap.exists()) {
          lastReadTimestamp = docSnap.data().timestamp;
        }
      });
      unsubscribes.push(unsubLastRead);

      // Listen to latest message in the chat
      const messagesPath = chatId === 'public'
        ? 'messages'
        : `chats/${chatId}/messages`;
      const messagesRef = collection(db, messagesPath);
      const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(20));

      const unsubMessages = onSnapshot(q, (snapshot) => {
        if (!lastReadTimestamp) {
          // Never read — count all messages not from current user
          let count = 0;
          snapshot.forEach((docSnap) => {
            if (docSnap.data().uid !== user.uid) count++;
          });
          setUnreadCounts((prev) => ({ ...prev, [chatId]: count }));
        } else {
          let count = 0;
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (
              data.uid !== user.uid &&
              data.createdAt &&
              data.createdAt.toMillis &&
              lastReadTimestamp?.toMillis &&
              data.createdAt.toMillis() > lastReadTimestamp.toMillis()
            ) {
              count++;
            }
          });
          setUnreadCounts((prev) => ({ ...prev, [chatId]: count }));
        }
      });
      unsubscribes.push(unsubMessages);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [chatIds]);

  return { unreadCounts, markAsRead };
}

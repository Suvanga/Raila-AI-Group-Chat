import { useEffect, useState } from 'react';
import { db, auth } from '../firebase-config.js';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';

/**
 * Manages the current user's online presence and exposes
 * a function to read other users' presence status.
 *
 * Firestore schema:
 *   presence/{uid} → { online: bool, lastSeen: timestamp }
 *   chats/{chatId}/typing/{uid} → { displayName, timestamp }
 */

// Set the current user as online and update lastSeen on disconnect
export function usePresence() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = doc(db, 'presence', user.uid);

    // Mark online
    const goOnline = () => {
      setDoc(presenceRef, {
        online: true,
        lastSeen: serverTimestamp(),
        displayName: user.displayName,
        photoURL: user.photoURL,
      }, { merge: true });
    };

    // Mark offline
    const goOffline = () => {
      setDoc(presenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
      }, { merge: true });
    };

    goOnline();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        goOffline();
      } else {
        goOnline();
      }
    };

    window.addEventListener('beforeunload', goOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      goOffline();
      window.removeEventListener('beforeunload', goOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}

// Subscribe to a specific user's presence
export function useUserPresence(uid) {
  const [presence, setPresence] = useState({ online: false, lastSeen: null });

  useEffect(() => {
    if (!uid) return;
    const presenceRef = doc(db, 'presence', uid);
    const unsubscribe = onSnapshot(presenceRef, (docSnap) => {
      if (docSnap.exists()) {
        setPresence(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [uid]);

  return presence;
}

// Resolve the typing collection path for any chat
function getTypingCollectionPath(chatId) {
  return chatId === 'public'
    ? 'typing'
    : `chats/${chatId}/typing`;
}

// Set typing indicator for the current user in a chat
export function useTypingIndicator(chatId) {
  const setTyping = (isTyping) => {
    const user = auth.currentUser;
    if (!user || !chatId) return;

    const typingPath = getTypingCollectionPath(chatId);
    const typingRef = doc(db, typingPath, user.uid);

    if (isTyping) {
      setDoc(typingRef, {
        displayName: user.displayName,
        timestamp: serverTimestamp(),
      });
    } else {
      deleteDoc(typingRef).catch(() => {});
    }
  };

  return { setTyping };
}

// Subscribe to who is currently typing in a chat
export function useTypingUsers(chatId) {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!chatId) {
      setTypingUsers([]);
      return;
    }

    const typingPath = getTypingCollectionPath(chatId);
    const typingRef = collection(db, typingPath);
    const q = query(typingRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = [];
      const currentUid = auth.currentUser?.uid;
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUid) {
          users.push({ uid: docSnap.id, ...docSnap.data() });
        }
      });
      setTypingUsers(users);
    });

    return () => unsubscribe();
  }, [chatId]);

  return typingUsers;
}

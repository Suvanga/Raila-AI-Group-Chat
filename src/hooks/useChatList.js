import { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config.js';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

export function useChatList() {
  const [groupChats, setGroupChats] = useState([]);
  const [dmChats, setDmChats] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('members', 'array-contains', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groups = [];
      const dms = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isGroup) {
          groups.push({ id: docSnap.id, ...data });
        } else if (data.isDM) {
          const otherUser = data.membersInfo?.find(
            (m) => m.uid !== auth.currentUser.uid
          );
          dms.push({
            id: docSnap.id,
            displayName: otherUser?.displayName || 'Unknown',
            photoURL: otherUser?.photoURL || null,
            ...data,
          });
        }
      });
      setGroupChats(groups);
      setDmChats(dms);
    });

    return () => unsubscribe();
  }, []);

  return { groupChats, dmChats };
}

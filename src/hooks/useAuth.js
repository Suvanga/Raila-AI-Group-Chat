import { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle redirect result (runs once on page load after signInWithRedirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const u = result.user;
          try {
            await setDoc(doc(db, 'users', u.uid), {
              displayName: u.displayName,
              email: u.email,
              photoURL: u.photoURL,
              lastSeen: serverTimestamp()
            }, { merge: true });
          } catch (err) {
            console.error('Firestore save after redirect:', err);
          }
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error:', err.code, err.message);
      });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

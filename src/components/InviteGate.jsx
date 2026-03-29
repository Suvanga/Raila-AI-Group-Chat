import React, { useState } from 'react';
import { auth, functions } from '../firebase-config.js';
import { httpsCallable } from 'firebase/functions';
import { signOut } from 'firebase/auth';

function InviteGate({ onApproved }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const redeemInviteCode = httpsCallable(functions, 'redeemInviteCode');
      await redeemInviteCode({ code: code.trim() });
      onApproved();
    } catch (err) {
      const msg = err?.message || 'Invalid invite code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-gate-container">
      <div className="invite-gate-box">
        <h2>Welcome to Raila <span>AI</span></h2>
        <p>This is an invite-only community. Enter your invite code to get started.</p>

        <form onSubmit={handleSubmit} className="invite-form">
          <input
            type="text"
            className="invite-code-input"
            placeholder="Enter invite code..."
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={12}
            autoFocus
          />
          <button
            type="submit"
            className="invite-submit-btn"
            disabled={loading || !code.trim()}
          >
            {loading ? 'Verifying...' : 'Join'}
          </button>
        </form>

        {error && <p className="invite-error">{error}</p>}

        <div className="invite-gate-footer">
          <p>Signed in as {auth.currentUser?.displayName || auth.currentUser?.email}</p>
          <button className="invite-signout-btn" onClick={() => signOut(auth)}>
            Use a different account
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteGate;

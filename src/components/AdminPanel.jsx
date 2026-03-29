import React, { useState, useEffect } from 'react';
import { functions } from '../firebase-config.js';
import { httpsCallable } from 'firebase/functions';

function AdminPanel({ setShowModal }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(5);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [newCode, setNewCode] = useState(null);

  const fetchCodes = async () => {
    try {
      const getInviteCodes = httpsCallable(functions, 'getInviteCodes');
      const result = await getInviteCodes();
      setCodes(result.data?.codes || []);
    } catch (err) {
      console.error('Failed to fetch invite codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setNewCode(null);
    try {
      const createInviteCode = httpsCallable(functions, 'createInviteCode');
      const result = await createInviteCode({ maxUses, expiresInDays });
      setNewCode(result.data?.code);
      fetchCodes();
    } catch (err) {
      console.error('Create invite error:', err);
      console.error('Failed to create invite code.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (code, currentActive) => {
    try {
      const toggleInviteCode = httpsCallable(functions, 'toggleInviteCode');
      await toggleInviteCode({ code, active: !currentActive });
      fetchCodes();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds ? timestamp._seconds * 1000 : timestamp);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content admin-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
        
        <h2>Admin Panel</h2>

        <div className="admin-section">
          <h3 className="admin-section-title">Generate Invite Code</h3>
          <div className="admin-create-row">
            <label className="admin-label">
              Max uses
              <input
                type="number"
                className="admin-input-small"
                value={maxUses}
                onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={50}
              />
            </label>
            <label className="admin-label">
              Expires in (days)
              <input
                type="number"
                className="admin-input-small"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={30}
              />
            </label>
            <button
              className="admin-create-btn"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Generate'}
            </button>
          </div>

          {newCode && (
            <div className="admin-new-code">
              <span className="admin-new-code-label">New code:</span>
              <code className="admin-code-display">{newCode}</code>
              <button
                className="admin-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(newCode);
                }}
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">Active Invite Codes</h3>
          {loading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
            </div>
          ) : codes.length === 0 ? (
            <p className="admin-empty">No invite codes created yet.</p>
          ) : (
            <div className="admin-codes-list">
              {codes.map(invite => (
                <div key={invite.id} className={`admin-code-row ${!invite.active ? 'inactive' : ''}`}>
                  <div className="admin-code-info">
                    <code className="admin-code-value">{invite.code}</code>
                    <div className="admin-code-meta">
                      <span>Uses: {invite.usedCount || 0}/{invite.maxUses}</span>
                      <span>Expires: {formatDate(invite.expiresAt)}</span>
                      <span>By: {invite.createdByName || 'Unknown'}</span>
                    </div>
                  </div>
                  <button
                    className={`admin-toggle-btn ${invite.active ? 'active' : ''}`}
                    onClick={() => handleToggle(invite.code, invite.active)}
                  >
                    {invite.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

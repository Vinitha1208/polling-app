import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, BarChart2, Lock, Trash2, Users } from 'lucide-react';
import { showToast } from './Toast';
import { api } from '../services/api';

export const PollCard = ({ poll, onStatusChange, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const shareUrl = `${window.location.origin}/poll/${poll.share_code}`;

  const copyShareLink = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to close this poll? Audience members will no longer be able to vote.')) {
      return;
    }
    setClosing(true);
    try {
      await api.closePoll(poll.poll_id);
      showToast('Poll closed successfully');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      showToast(err.message || 'Failed to close poll', 'error');
    } finally {
      setClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }
    try {
      await api.deletePoll(poll.poll_id);
      showToast('Poll deleted successfully');
      if (onDelete) onDelete(poll.poll_id);
    } catch (err) {
      showToast(err.message || 'Failed to delete poll', 'error');
    }
  };

  const isClosed = poll.status === 'closed' || poll.is_expired;

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with status and code */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isClosed ? (
            <span className="pill-badge pill-closed">
              <Lock size={12} /> Closed
            </span>
          ) : (
            <span className="pill-badge pill-active">
              <span className="pulse-dot" /> Active
            </span>
          )}

          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            #{poll.share_code}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <Users size={16} color="var(--primary)" />
          <strong style={{ color: 'var(--text-main)' }}>{poll.total_votes}</strong> {poll.total_votes === 1 ? 'vote' : 'votes'}
        </div>
      </div>

      {/* Question */}
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          lineHeight: 1.4,
          color: 'var(--text-main)',
        }}
      >
        {poll.question}
      </h3>

      {/* Mini preview of options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {poll.options && poll.options.slice(0, 3).map((opt) => (
          <div
            key={opt.id}
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>• {opt.text}</span>
            <span style={{ fontWeight: 600 }}>{opt.votes} ({Math.round(opt.percentage)}%)</span>
          </div>
        ))}
        {poll.options && poll.options.length > 3 && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            +{poll.options.length - 3} more options
          </span>
        )}
      </div>

      {/* Card Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={copyShareLink}
            className="btn btn-secondary btn-sm"
            title="Copy share link for audience"
          >
            {copied ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <Link to={`/poll/${poll.poll_id}/results`} className="btn btn-primary btn-sm">
            <BarChart2 size={15} />
            Live Results
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isClosed && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="btn btn-secondary btn-sm"
              title="Close Poll"
              style={{ color: 'var(--accent-amber)' }}
            >
              <Lock size={15} />
              Close
            </button>
          )}

          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            title="Delete Poll"
            style={{ padding: '0.5rem' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

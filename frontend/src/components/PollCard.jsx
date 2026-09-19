import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, BarChart2, Lock, Trash2, Users, Radio, Sparkles } from 'lucide-react';
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
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        background: 'rgba(13, 19, 38, 0.75)',
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isClosed ? (
            <span className="pill-badge pill-closed">
              <Lock size={12} /> Closed
            </span>
          ) : (
            <span className="pill-badge pill-active">
              <span className="pulse-dot" /> Live Active
            </span>
          )}

          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.08em',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#c7d2fe',
              padding: '0.22rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            #{poll.share_code}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.25rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Users size={15} color="var(--primary)" />
          <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{poll.total_votes}</strong>{' '}
          {poll.total_votes === 1 ? 'vote' : 'votes'}
        </div>
      </div>

      {/* Question */}
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          lineHeight: 1.45,
          color: 'var(--text-main)',
        }}
      >
        {poll.question}
      </h3>

      {/* Options preview with mini visual bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {poll.options && poll.options.slice(0, 3).map((opt) => (
          <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: 'var(--text-main)' }}>{opt.text}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                {opt.votes} ({Math.round(opt.percentage || 0)}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${opt.percentage || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
        {poll.options && poll.options.length > 3 && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            +{poll.options.length - 3} additional voting choices
          </span>
        )}
      </div>

      {/* Card Action Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '1.2rem',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            onClick={copyShareLink}
            className="btn btn-secondary btn-sm"
            title="Copy audience share link"
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Share Link'}
          </button>

          <Link to={`/poll/${poll.poll_id}/results`} className="btn btn-primary btn-sm">
            <BarChart2 size={14} />
            Live Results
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {!isClosed && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="btn btn-secondary btn-sm"
              title="Close Poll to new votes"
              style={{ color: 'var(--accent-amber)', padding: '0.45rem 0.75rem' }}
            >
              <Lock size={14} />
              Close
            </button>
          )}

          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            title="Delete this poll"
            style={{ padding: '0.45rem 0.65rem' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

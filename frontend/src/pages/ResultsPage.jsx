import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLivePoll } from '../hooks/useLivePoll';
import { LiveResultsChart } from '../components/LiveResultsChart';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Radio,
  Wifi,
  WifiOff,
  Share2,
  Copy,
  Check,
  Lock,
  Vote,
  ArrowLeft,
  Users,
  Sparkles,
} from 'lucide-react';
import { showToast } from '../components/Toast';

export const ResultsPage = () => {
  const { id } = useParams();
  const { pollData, loading, error, connectionStatus } = useLivePoll(id);
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const shareUrl = pollData ? `${window.location.origin}/poll/${pollData.share_code}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePoll = async () => {
    if (!window.confirm('Are you sure you want to close this poll? Audience will no longer be able to vote.')) {
      return;
    }
    setClosing(true);
    try {
      await api.closePoll(id);
      showToast('Poll has been closed.');
    } catch (err) {
      showToast(err.message || 'Failed to close poll', 'error');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="pulse-dot" style={{ color: 'var(--primary)', width: '14px', height: '14px' }} />
        <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Connecting to live poll stream...</span>
      </div>
    );
  }

  if (error || !pollData) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Unable to Load Results
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {error || 'Poll not found'}
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = pollData.status === 'closed' || pollData.is_expired;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Navigation & Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Live WebSocket Connection Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {connectionStatus === 'connected' ? (
            <span
              className="pill-badge"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.35rem 0.85rem',
              }}
            >
              <span className="pulse-dot" /> LIVE SYNC ACTIVE
            </span>
          ) : connectionStatus === 'connecting' ? (
            <span
              className="pill-badge"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '0.35rem 0.85rem',
              }}
            >
              <Wifi size={14} className="spin-icon" /> RECONNECTING...
            </span>
          ) : (
            <span
              className="pill-badge"
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '0.35rem 0.85rem',
              }}
            >
              <WifiOff size={14} /> OFFLINE
            </span>
          )}

          {isClosed ? (
            <span className="pill-badge pill-closed">
              <Lock size={12} /> Closed
            </span>
          ) : (
            <span className="pill-badge pill-active">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Main Results Card */}
      <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Title Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              CODE: #{pollData.share_code}
            </span>
            {pollData.expires_at && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Closes: {new Date(pollData.expires_at).toLocaleString()}
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.3,
              color: 'var(--text-main)',
            }}
          >
            {pollData.question}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
              }}
            >
              <Users size={18} color="var(--primary)" />
              <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>
                {pollData.total_votes}
              </strong>{' '}
              {pollData.total_votes === 1 ? 'total vote' : 'total votes'}
            </div>

            <span style={{ color: 'var(--text-dim)' }}>•</span>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real-time WebSocket feed driven by Redis Pub/Sub
            </span>
          </div>
        </div>

        {/* Live Animated Chart */}
        <LiveResultsChart
          options={pollData.options}
          totalVotes={pollData.total_votes}
        />

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Share Link Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.5rem 0.4rem 1rem',
              gap: '0.75rem',
              maxWidth: '450px',
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {shareUrl}
            </span>
            <button
              onClick={copyShareLink}
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/poll/${pollData.share_code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open public voting screen in a new tab"
            >
              <Vote size={15} /> Cast a Vote
            </Link>

            {user && !isClosed && (
              <button
                onClick={handleClosePoll}
                disabled={closing}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--accent-amber)' }}
              >
                <Lock size={15} /> Close Poll
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

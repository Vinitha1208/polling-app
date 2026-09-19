import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PollCard } from '../components/PollCard';
import { PlusCircle, RefreshCw, BarChart3, Radio, Vote, Zap, Layers } from 'lucide-react';
import { showToast } from '../components/Toast';

export const DashboardPage = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolls = async () => {
    try {
      const res = await api.getMyPolls();
      setPolls(res.polls || []);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
      showToast(err.message || 'Failed to load your polls', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPolls();
  };

  const handlePollDeleted = (deletedId) => {
    setPolls((prev) => prev.filter((p) => p.poll_id !== deletedId));
  };

  const totalPolls = polls.length;
  const activePolls = polls.filter((p) => p.status === 'active' && !p.is_expired).length;
  const totalVotesCast = polls.reduce((acc, p) => acc + (p.total_votes || 0), 0);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1.25rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="pulse-dot" style={{ color: 'var(--primary)', width: '16px', height: '16px' }} />
        <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Loading your live polls...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              className="pill-badge"
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '0.2rem 0.65rem',
              }}
            >
              <Zap size={12} /> Real-Time Engine Active
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              color: '#0f172a',
            }}
          >
            Live Poll <span style={{ color: '#2563eb' }}>Dashboard</span>
          </h1>

          <p style={{ color: '#64748b', marginTop: '0.4rem', fontSize: '1.02rem', maxWidth: '620px' }}>
            Launch polls, distribute share links, and watch audience votes stream in real-time powered by Redis Pub/Sub.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', alignSelf: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
            title="Refresh poll list"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            Refresh
          </button>

          <Link
            to="/create-poll"
            className="btn btn-primary"
            style={{
              padding: '0.85rem 1.75rem',
            }}
          >
            <PlusCircle size={18} />
            Create Poll
          </Link>
        </div>
      </div>

      {/* Metrics Row with Clean Light Discs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Total Created */}
        <div className="glass-card stat-metric-card">
          <div
            className="stat-icon-wrapper"
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Created
            </span>
            <p style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.15, marginTop: '0.2rem', color: '#0f172a' }}>
              {totalPolls}
            </p>
          </div>
        </div>

        {/* Active Now */}
        <div className="glass-card stat-metric-card">
          <div
            className="stat-icon-wrapper"
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
            }}
          >
            <Radio size={24} />
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Polls
            </span>
            <p style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.15, marginTop: '0.2rem', color: '#059669' }}>
              {activePolls}
            </p>
          </div>
        </div>

        {/* Total Votes */}
        <div className="glass-card stat-metric-card">
          <div
            className="stat-icon-wrapper"
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0284c7',
            }}
          >
            <Vote size={24} />
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Votes Received
            </span>
            <p style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.15, marginTop: '0.2rem', color: '#0284c7' }}>
              {totalVotesCast}
            </p>
          </div>
        </div>
      </div>

      {/* Polls Listing Grid */}
      {polls.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '4.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            background: '#ffffff',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <BarChart3 size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#0f172a' }}>
              No Polls Created Yet
            </h3>
            <p style={{ color: '#64748b', maxWidth: '440px', margin: '0.5rem auto 0', fontSize: '0.98rem' }}>
              Launch your first live poll in seconds. Share the link with your audience and watch live updates with zero page refreshes.
            </p>
          </div>

          <Link
            to="/create-poll"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.85rem 1.85rem' }}
          >
            <PlusCircle size={18} />
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.6rem',
          }}
        >
          {polls.map((poll) => (
            <PollCard
              key={poll.poll_id}
              poll={poll}
              onStatusChange={fetchPolls}
              onDelete={handlePollDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

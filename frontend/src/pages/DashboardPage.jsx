import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PollCard } from '../components/PollCard';
import { PlusCircle, RefreshCw, BarChart3, Radio, CheckCircle, Vote } from 'lucide-react';
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

  // Stats
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
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="pulse-dot" style={{ color: 'var(--primary)', width: '12px', height: '12px' }} />
        <span>Loading your polls...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Stats Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            Poll Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Manage active live polls, share with your audience, and monitor real-time votes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
            title="Refresh poll list"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            Refresh
          </button>
          <Link to="/create-poll" className="btn btn-primary">
            <PlusCircle size={18} />
            Create Poll
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Total Created
            </span>
            <BarChart3 size={20} color="var(--primary)" />
          </div>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              marginTop: '0.5rem',
            }}
          >
            {totalPolls}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Active Polls
            </span>
            <Radio size={20} color="#34d399" />
          </div>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              marginTop: '0.5rem',
              color: '#34d399',
            }}
          >
            {activePolls}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Total Votes Received
            </span>
            <Vote size={20} color="#60a5fa" />
          </div>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              marginTop: '0.5rem',
              color: '#60a5fa',
            }}
          >
            {totalVotesCast}
          </p>
        </div>
      </div>

      {/* Polls Listing */}
      {polls.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <BarChart3 size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              No Polls Created Yet
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto 0' }}>
              Create your first live poll in seconds and share the generated link with your audience.
            </p>
          </div>
          <Link to="/create-poll" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <PlusCircle size={18} />
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
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

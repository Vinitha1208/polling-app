import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getVoterToken } from '../services/api';
import { LiveResultsChart } from '../components/LiveResultsChart';
import { CheckCircle2, Lock, AlertCircle, BarChart3, Share2, ArrowRight, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { showToast } from '../components/Toast';

export const VotePage = () => {
  const { shareCode } = useParams();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [updatedResults, setUpdatedResults] = useState(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await api.getPollByShareCode(shareCode);
        setPoll(data);

        // Check if user already voted in this poll from this browser
        const storedVotes = JSON.parse(localStorage.getItem('user_voted_polls') || '{}');
        if (storedVotes[data.id]) {
          setHasVoted(true);
          setSelectedOption(storedVotes[data.id]);
          const results = await api.getPollResults(data.id);
          setUpdatedResults(results);
        }
      } catch (err) {
        setError(err.message || 'Poll not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [shareCode]);

  const handleVoteSubmit = async () => {
    if (!selectedOption) {
      showToast('Please select an option before voting.', 'error');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.castVote(poll.id, selectedOption);
      setUpdatedResults(res.results);
      setHasVoted(true);

      // Save to localStorage
      const storedVotes = JSON.parse(localStorage.getItem('user_voted_polls') || '{}');
      storedVotes[poll.id] = selectedOption;
      localStorage.setItem('user_voted_polls', JSON.stringify(storedVotes));

      // Fire vibrant multi-color confetti!
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#a855f7', '#10b981', '#06b6d4', '#ec4899'],
      });

      showToast('Vote cast successfully!');
    } catch (err) {
      if (err.status === 409 || (err.data && err.data.already_voted)) {
        setHasVoted(true);
        showToast('You have already voted in this poll.', 'info');
        try {
          const res = await api.getPollResults(poll.id);
          setUpdatedResults(res);
        } catch (_) {}
      } else {
        setError(err.message || 'Failed to submit your vote.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Poll share link copied!');
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
          gap: '1.25rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="pulse-dot" style={{ color: 'var(--primary)', width: '16px', height: '16px' }} />
        <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Loading live poll...</span>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3.5rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fda4af',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertCircle size={32} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Poll Not Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.98rem' }}>
            {error || 'This poll may have ended or the link is incorrect.'}
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = poll.status === 'closed' || (poll.expires_at && new Date() > new Date(poll.expires_at));

  return (
    <div style={{ maxWidth: '680px', margin: '1rem auto' }}>
      <div
        className="glass-card"
        style={{
          padding: '2.75rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          background: 'rgba(13, 19, 38, 0.78)',
        }}
      >
        {/* Header Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {isClosed ? (
              <span className="pill-badge pill-closed">
                <Lock size={12} /> Closed
              </span>
            ) : (
              <span className="pill-badge pill-active">
                <span className="pulse-dot" /> Live Polling
              </span>
            )}

            <span
              style={{
                fontSize: '0.82rem',
                color: '#c7d2fe',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.25rem 0.65rem',
                borderRadius: '8px',
                letterSpacing: '0.05em',
              }}
            >
              #{poll.share_code}
            </span>
          </div>

          <button
            onClick={copyShareLink}
            className="btn btn-secondary btn-sm"
            title="Share this poll link"
          >
            <Share2 size={14} /> Share Link
          </button>
        </div>

        {/* Poll Question */}
        <div>
          <h1
            style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
            }}
          >
            {poll.question}
          </h1>

          {poll.expires_at && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.6rem' }}>
              Closes on: {new Date(poll.expires_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Voting Options vs Live Results */}
        {!hasVoted && !isClosed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {poll.options.map((option, index) => {
              const isSelected = selectedOption === option.id;
              const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
              const letter = letters[index] || `${index + 1}`;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`voting-option-card ${isSelected ? 'selected' : ''}`}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      flexShrink: 0,
                    }}
                  >
                    {letter}
                  </span>

                  <span style={{ fontSize: '1.08rem', fontWeight: 600, color: 'var(--text-main)', flex: 1 }}>
                    {option.text}
                  </span>

                  <div className="custom-radio">
                    <div className="custom-radio-inner" />
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleVoteSubmit}
              disabled={submitting || !selectedOption}
              className="btn btn-primary"
              style={{
                marginTop: '1rem',
                padding: '1.1rem',
                fontSize: '1.1rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: selectedOption ? '0 10px 35px var(--primary-glow)' : 'none',
              }}
            >
              {submitting ? 'Recording Vote...' : 'Submit Your Vote'}
              <ArrowRight size={20} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link
                to={`/poll/${poll.id}/results`}
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-dim)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500,
                }}
              >
                <BarChart3 size={16} /> View real-time results without voting
              </Link>
            </div>
          </div>
        ) : (
          /* Post Vote Confirmation & Inline Results */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div
              style={{
                background: hasVoted
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(6, 182, 212, 0.12) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${hasVoted ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: hasVoted ? '0 0 25px rgba(16, 185, 129, 0.15)' : 'none',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: hasVoted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={24} color={hasVoted ? '#34d399' : 'var(--text-muted)'} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                  {hasVoted ? 'Your vote is recorded!' : 'This poll is closed.'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.15rem' }}>
                  Live vote counts below sync automatically in real-time.
                </p>
              </div>
            </div>

            {updatedResults && (
              <LiveResultsChart
                options={updatedResults.options}
                totalVotes={updatedResults.total_votes}
                selectedOptionId={selectedOption}
              />
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Link
                to={`/poll/${poll.id}/results`}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.9rem' }}
              >
                <BarChart3 size={18} /> Open Full Live Results Board
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

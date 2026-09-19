import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getVoterToken } from '../services/api';
import { LiveResultsChart } from '../components/LiveResultsChart';
import { CheckCircle2, Lock, AlertCircle, BarChart3, Share2, ArrowRight } from 'lucide-react';
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
          // Fetch existing results
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

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });

      showToast('Vote recorded successfully!');
    } catch (err) {
      if (err.status === 409 || (err.data && err.data.already_voted)) {
        setHasVoted(true);
        showToast('You have already voted in this poll.', 'info');
        // Fetch current results
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
    showToast('Poll link copied!');
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
        <div className="pulse-dot" style={{ color: 'var(--primary)', width: '12px', height: '12px' }} />
        <span>Loading poll...</span>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem' }}>
          <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Poll Not Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {error || 'This poll may have been deleted or the link is incorrect.'}
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = poll.status === 'closed' || (poll.expires_at && new Date() > new Date(poll.expires_at));

  return (
    <div style={{ maxWidth: '640px', margin: '1rem auto' }}>
      <div
        className="glass-card"
        style={{
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        {/* Top bar: Status badge + Share button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isClosed ? (
              <span className="pill-badge pill-closed">
                <Lock size={12} /> Closed
              </span>
            ) : (
              <span className="pill-badge pill-active">
                <span className="pulse-dot" /> Open for Voting
              </span>
            )}

            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              #{poll.share_code}
            </span>
          </div>

          <button
            onClick={copyShareLink}
            className="btn btn-secondary btn-sm"
            title="Share this poll"
          >
            <Share2 size={14} /> Share
          </button>
        </div>

        {/* Poll Question */}
        <div>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.35,
              color: 'var(--text-main)',
            }}
          >
            {poll.question}
          </h1>
          {poll.expires_at && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              Closes: {new Date(poll.expires_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Voting UI vs Post-Vote Results */}
        {!hasVoted && !isClosed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {poll.options.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`voting-option-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="custom-radio">
                    <div className="custom-radio-inner" />
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-main)', flex: 1 }}>
                    {option.text}
                  </span>
                </div>
              );
            })}

            <button
              onClick={handleVoteSubmit}
              disabled={submitting || !selectedOption}
              className="btn btn-primary"
              style={{
                marginTop: '1rem',
                padding: '1rem',
                fontSize: '1.05rem',
                boxShadow: selectedOption ? '0 8px 30px var(--primary-glow)' : 'none',
              }}
            >
              {submitting ? 'Submitting Vote...' : 'Submit Vote'}
              <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link
                to={`/poll/${poll.id}/results`}
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-dim)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <BarChart3 size={15} /> Just view live results
              </Link>
            </div>
          </div>
        ) : (
          /* Post Vote or Closed Poll Results View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                background: hasVoted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${hasVoted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircle2 size={22} color={hasVoted ? '#34d399' : 'var(--text-muted)'} />
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {hasVoted ? 'Thank you! Your vote has been recorded.' : 'This poll is closed.'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Live results will update automatically below as more votes arrive.
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
                style={{ flex: 1 }}
              >
                <BarChart3 size={18} /> Open Fullscreen Live View
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

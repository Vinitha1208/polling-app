import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Trash2, Clock, Sparkles, AlertCircle, ArrowRight, Share2, Check, HelpCircle } from 'lucide-react';
import { showToast } from '../components/Toast';

export const CreatePollPage = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expirationType, setExpirationType] = useState('never');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Post-creation modal state
  const [createdPoll, setCreatedPoll] = useState(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanQuestion = question.trim();
    if (cleanQuestion.length < 5) {
      setError('Poll question must be at least 5 characters long.');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    const unique = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (unique.size !== cleanOptions.length) {
      setError('Options cannot contain duplicates.');
      return;
    }

    setLoading(true);
    try {
      const poll = await api.createPoll({
        question: cleanQuestion,
        options: cleanOptions,
        expiration_type: expirationType,
      });

      showToast('Poll launched successfully!');
      setCreatedPoll(poll);
    } catch (err) {
      setError(err.message || 'Failed to create poll.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetFill = (type) => {
    if (type === 'dev') {
      setQuestion('Which backend framework is best for real-time live polling?');
      setOptions(['Go + Gin (Compiled & Fast)', 'Node.js + Express', 'Python FastAPI', 'Rust Actix-web']);
    } else if (type === 'team') {
      setQuestion('What time works best for our live product demo?');
      setOptions(['10:00 AM EST', '2:00 PM EST', '5:00 PM EST', 'Async video recording']);
    }
  };

  const shareUrl = createdPoll ? `${window.location.origin}/poll/${createdPoll.share_code}` : '';

  const copyCreatedLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2.25rem' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
          }}
        >
          <span className="gradient-heading">Create a New</span>{' '}
          <span className="gradient-accent-heading">Live Poll</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '1.02rem' }}>
          Craft your question, customize audience choices, and obtain a real-time shareable link.
        </p>

        {/* Quick idea chips */}
        <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            Instant Templates:
          </span>
          <button
            type="button"
            onClick={() => handlePresetFill('dev')}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="var(--primary)" /> Tech Stack Poll
          </button>
          <button
            type="button"
            onClick={() => handlePresetFill('team')}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#059669" /> Meeting Scheduling
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div
        className="glass-card"
        style={{
          padding: '2.5rem 2.25rem',
          background: '#ffffff',
        }}
      >
        {error && (
          <div
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.15rem',
              color: '#e11d48',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.75rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Question Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Poll Question
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. What is your favorite programming language?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              maxLength={300}
              style={{ fontSize: '1.1rem', padding: '1rem 1.25rem' }}
            />
          </div>

          {/* Voting Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Voting Options (2–10)
              </label>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                {options.length} of 10 choices configured
              </span>
            </div>

            {options.map((opt, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>

                <input
                  type="text"
                  className="form-input"
                  placeholder={`Choice ${index + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn btn-secondary btn-sm"
                    title="Remove choice"
                    style={{ padding: '0.8rem', color: '#e11d48' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="btn btn-secondary"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '0.5rem',
                  borderStyle: 'dashed',
                  borderColor: '#bfdbfe',
                  color: '#2563eb',
                }}
              >
                <Plus size={16} /> Add Choice
              </button>
            )}
          </div>

          {/* Expiration Settings */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Clock size={16} color="var(--primary)" />
              Poll Duration & Expiration
            </label>
            <select
              className="form-select"
              value={expirationType}
              onChange={(e) => setExpirationType(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="never">Never expires (Manual closure by creator)</option>
              <option value="1h">1 Hour from now</option>
              <option value="24h">24 Hours (1 Day)</option>
              <option value="7d">7 Days</option>
            </select>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1, padding: '1rem', fontSize: '1.08rem' }}
            >
              {loading ? 'Launching Live Poll...' : 'Launch Live Poll'}
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Post Launch Modal */}
      {createdPoll && (
        <div className="modal-backdrop">
          <div
            className="glass-card"
            style={{
              maxWidth: '540px',
              width: '100%',
              padding: '2.75rem 2.25rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.6rem',
              background: '#ffffff',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.18)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                border: '1px solid #a7f3d0',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.15)',
              }}
            >
              <Share2 size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Poll is Live!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginTop: '0.35rem' }}>
                Share this unique link with your audience. Results update on your dashboard in real-time.
              </p>
            </div>

            {/* Share link box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 0.5rem 0.5rem 1.15rem',
                gap: '0.85rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-main)',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  textAlign: 'left',
                }}
              >
                {shareUrl}
              </span>
              <button
                onClick={copyCreatedLink}
                className="btn btn-primary btn-sm"
                style={{ flexShrink: 0, padding: '0.5rem 1.1rem' }}
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.85rem' }}
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate(`/poll/${createdPoll.id}/results`)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.85rem' }}
              >
                Open Live View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

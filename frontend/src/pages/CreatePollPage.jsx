import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Trash2, Clock, Sparkles, AlertCircle, ArrowRight, Share2, Check } from 'lucide-react';
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

    // Check duplicate options
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
      setQuestion('What is your primary programming language in 2026?');
      setOptions(['Python', 'TypeScript / JavaScript', 'Go', 'Rust']);
    } else if (type === 'team') {
      setQuestion('When should we schedule our weekly live engineering demo?');
      setOptions(['Monday morning', 'Wednesday afternoon', 'Friday lunch', 'Async recording']);
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          Create a Live Poll
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Set your question and choices. A real-time link will be generated instantly for your audience.
        </p>

        {/* Quick templates */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
            Quick Ideas:
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
            <Sparkles size={14} color="#34d399" /> Meeting Time Poll
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2.25rem' }}>
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              color: '#fca5a5',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Question */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
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
              style={{ fontSize: '1.05rem', padding: '0.9rem 1.2rem' }}
            />
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Voting Options (2–10)
              </label>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                {options.length} / 10 options
              </span>
            </div>

            {options.map((opt, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  style={{
                    width: '28px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                  }}
                >
                  {index + 1}.
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn btn-secondary btn-sm"
                    title="Remove option"
                    style={{ padding: '0.75rem', color: '#f87171' }}
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
                }}
              >
                <Plus size={16} /> Add Another Option
              </button>
            )}
          </div>

          {/* Expiration Settings */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--primary)" />
              Poll Duration / Expiration
            </label>
            <select
              className="form-select"
              value={expirationType}
              onChange={(e) => setExpirationType(e.target.value)}
            >
              <option value="never">Never expires (Manual close)</option>
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours (1 Day)</option>
              <option value="7d">7 Days</option>
            </select>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1, padding: '0.9rem' }}
            >
              {loading ? 'Creating Poll...' : 'Launch Poll Now'}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Post Creation Modal / Celebration */}
      {createdPoll && (
        <div className="modal-backdrop">
          <div
            className="glass-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-active)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <Share2 size={30} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Poll is Live!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                Share this unique link with your audience so they can cast their votes in real-time.
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
                padding: '0.5rem 0.5rem 0.5rem 1rem',
                gap: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
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
                style={{ flexShrink: 0 }}
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate(`/poll/${createdPoll.id}/results`)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                View Live Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

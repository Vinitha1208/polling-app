import React from 'react';
import { Trophy, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export const LiveResultsChart = ({ options = [], totalVotes = 0, selectedOptionId = null }) => {
  const highestVotes = Math.max(...options.map((o) => o.votes || 0), 0);
  const hasVotes = totalVotes > 0;
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', width: '100%' }}>
      {options.map((opt, index) => {
        const isLeading = hasVotes && opt.votes === highestVotes && highestVotes > 0;
        const isSelectedByUser = selectedOptionId === opt.id;
        const percentage = Math.round(opt.percentage || 0);
        const letter = optionLetters[index] || `${index + 1}`;

        return (
          <div
            key={opt.id}
            className={`vote-bar-container ${isLeading ? 'leading' : ''}`}
            style={{
              borderColor: isSelectedByUser ? 'var(--primary)' : undefined,
              boxShadow: isSelectedByUser
                ? '0 0 25px rgba(99, 102, 241, 0.25), inset 0 0 1px 1px rgba(99, 102, 241, 0.5)'
                : undefined,
            }}
          >
            {/* Animated percentage fill */}
            <div
              className={`vote-bar-fill ${isLeading ? 'leading' : ''}`}
              style={{ width: `${opt.percentage || 0}%` }}
            />

            {/* Foreground Content */}
            <div className="vote-bar-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: isLeading
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isSelectedByUser
                      ? 'rgba(99, 102, 241, 0.25)'
                      : 'rgba(255, 255, 255, 0.07)',
                    border: isLeading
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : isSelectedByUser
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: isLeading ? '#34d399' : isSelectedByUser ? '#a5b4fc' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </span>

                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: isLeading ? 700 : 600,
                    color: 'var(--text-main)',
                  }}
                >
                  {opt.text}
                </span>

                {isSelectedByUser && (
                  <span
                    className="pill-badge"
                    style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.45)',
                      padding: '0.2rem 0.65rem',
                    }}
                  >
                    <CheckCircle2 size={12} /> Your Vote
                  </span>
                )}

                {isLeading && (
                  <span
                    className="pill-badge"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      padding: '0.2rem 0.65rem',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Trophy size={13} color="#34d399" /> Leader
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                </span>

                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: isLeading ? '#34d399' : '#f8fafc',
                    minWidth: '56px',
                    textAlign: 'right',
                    textShadow: isLeading ? '0 0 15px rgba(16, 185, 129, 0.5)' : undefined,
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {totalVotes === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Awaiting Live Audience Votes</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Share your poll link. Watch results and animated bars update instantaneously when votes arrive!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

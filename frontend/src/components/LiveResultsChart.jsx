import React from 'react';
import { Trophy, CheckCircle2, TrendingUp } from 'lucide-react';

export const LiveResultsChart = ({ options = [], totalVotes = 0, selectedOptionId = null }) => {
  const highestVotes = Math.max(...options.map((o) => o.votes || 0), 0);
  const hasVotes = totalVotes > 0;
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
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
              borderColor: isSelectedByUser ? '#2563eb' : undefined,
              boxShadow: isSelectedByUser
                ? '0 4px 16px rgba(37, 99, 235, 0.15)'
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
                      ? '#ecfdf5'
                      : isSelectedByUser
                      ? '#eff6ff'
                      : '#f1f5f9',
                    border: isLeading
                      ? '1px solid #a7f3d0'
                      : isSelectedByUser
                      ? '1px solid #93c5fd'
                      : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: isLeading ? '#059669' : isSelectedByUser ? '#2563eb' : '#64748b',
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </span>

                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: isLeading ? 700 : 600,
                    color: '#0f172a',
                  }}
                >
                  {opt.text}
                </span>

                {isSelectedByUser && (
                  <span
                    className="pill-badge"
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
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
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      padding: '0.2rem 0.65rem',
                    }}
                  >
                    <Trophy size={13} color="#059669" /> Leader
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: '#64748b',
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
                    color: isLeading ? '#059669' : '#0f172a',
                    minWidth: '56px',
                    textAlign: 'right',
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
            color: '#64748b',
            fontSize: '0.95rem',
            background: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed #cbd5e1',
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
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#0f172a' }}>Awaiting Live Audience Votes</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              Share your poll link. Watch results and animated bars update instantaneously when votes arrive!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

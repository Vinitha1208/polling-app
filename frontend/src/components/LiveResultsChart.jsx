import React from 'react';
import { Award, CheckCircle } from 'lucide-react';

export const LiveResultsChart = ({ options = [], totalVotes = 0, selectedOptionId = null }) => {
  // Find highest vote count to highlight the leader
  const highestVotes = Math.max(...options.map((o) => o.votes || 0), 0);
  const hasMultipleVotes = totalVotes > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {options.map((opt) => {
        const isLeading = hasMultipleVotes && opt.votes === highestVotes && highestVotes > 0;
        const isSelectedByUser = selectedOptionId === opt.id;
        const percentage = Math.round(opt.percentage || 0);

        return (
          <div
            key={opt.id}
            className={`vote-bar-container ${isLeading ? 'leading' : ''}`}
            style={{
              borderColor: isSelectedByUser ? 'var(--primary)' : undefined,
            }}
          >
            {/* Animated percentage fill */}
            <div
              className={`vote-bar-fill ${isLeading ? 'leading' : ''}`}
              style={{ width: `${opt.percentage || 0}%` }}
            />

            {/* Foreground Content */}
            <div className="vote-bar-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{opt.text}</span>
                {isSelectedByUser && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(99, 102, 241, 0.25)',
                      color: 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <CheckCircle size={12} /> Your Vote
                  </span>
                )}
                {isLeading && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: '#34d399',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    <Award size={14} color="#34d399" /> Leading
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: isLeading ? '#34d399' : 'var(--text-main)',
                    minWidth: '48px',
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
            padding: '2rem',
            color: 'var(--text-dim)',
            fontSize: '0.95rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          No votes cast yet. Share the poll link with your audience to start seeing live updates!
        </div>
      )}
    </div>
  );
};

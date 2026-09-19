import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, PlusCircle, LogOut, User, Zap, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5, 8, 20, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.9rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo with Shimmering Glow */}
        <Link
          to={user ? '/dashboard' : '/login'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
              position: 'relative',
            }}
          >
            <BarChart3 size={22} color="#ffffff" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.35rem',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 40%, #c7d2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PollPulse
            </span>

            <span
              className="pill-badge pill-live"
              style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.55rem',
                letterSpacing: '0.08em',
              }}
            >
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} /> LIVE
            </span>
          </div>
        </Link>

        {/* Right Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                Dashboard
              </Link>

              <Link
                to="/create-poll"
                className="btn btn-primary btn-sm"
                style={{
                  boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)',
                }}
              >
                <PlusCircle size={15} />
                Create Poll
              </Link>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingLeft: '0.6rem',
                  borderLeft: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Log out"
                  style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                <Sparkles size={14} /> Get Started Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

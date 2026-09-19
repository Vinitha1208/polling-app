import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, PlusCircle, LogOut, User, Sparkles } from 'lucide-react';

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
        background: 'rgba(9, 13, 22, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          to={user ? '/dashboard' : '/login'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}
          >
            <BarChart3 size={20} color="#fff" />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Poll<span style={{ color: 'var(--primary)' }}>Pulse</span>
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '2px 6px',
                borderRadius: '999px',
                fontWeight: 700,
                marginLeft: '4px',
              }}
            >
              LIVE
            </span>
          </span>
        </Link>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                Dashboard
              </Link>
              <Link to="/create-poll" className="btn btn-primary btn-sm">
                <PlusCircle size={16} />
                Create Poll
              </Link>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingLeft: '0.5rem',
                  borderLeft: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={16} color="var(--primary)" />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Log out"
                  style={{ padding: '0.5rem' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

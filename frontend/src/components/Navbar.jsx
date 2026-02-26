import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/transactions', icon: '↕', label: 'Transactions' },
  { to: '/budgets', icon: '◎', label: 'Budgets' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.75rem 1.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          💸 Cashzi
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.25rem' }}>
          Personal Finance
        </div>
      </div>

      {/* User pill */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
          }}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.875rem',
              borderRadius: '10px',
              marginBottom: '0.25rem',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#fff' : 'var(--color-text-muted)',
              background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '10px',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text-dim)', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span>⎋</span> Sign out
        </button>
      </div>
    </aside>
  );
}

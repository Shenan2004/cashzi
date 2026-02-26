import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center" style={{ background: 'var(--color-bg)' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '2rem', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="gradient-text" style={{ fontSize: '2.25rem', fontWeight: 800 }}>💸 Cashzi</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Your personal finance command center
          </p>
        </div>

        <div className="card" style={{ borderRadius: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Welcome back</h2>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Email</label>
              <input
                className="input-field"
                type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
                id="login-email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password" name="password" placeholder="••••••••"
                value={form.password} onChange={handleChange} required
                id="login-password"
              />
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              id="login-submit"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

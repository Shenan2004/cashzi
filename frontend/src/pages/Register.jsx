import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form.name, form.email, form.password);
      navigate('/login');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      if (msgs?.length) {
        setError(msgs.map(e => e.msg).join(' · '));
      } else {
        setError(err.response?.data?.error || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center" style={{ background: 'var(--color-bg)' }}>
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '2rem', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="gradient-text" style={{ fontSize: '2.25rem', fontWeight: 800 }}>💸 Cashzi</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Take control of your finances today
          </p>
        </div>

        <div className="card" style={{ borderRadius: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create your account</h2>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Full name</label>
              <input
                className="input-field"
                type="text" name="name" placeholder="Alex Johnson"
                value={form.name} onChange={handleChange} required minLength={2}
                id="register-name"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input-field"
                type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
                id="register-email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password" name="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} required minLength={6}
                id="register-password"
              />
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              id="register-submit"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account…</> : 'Create account →'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

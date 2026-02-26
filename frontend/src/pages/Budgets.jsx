import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function BudgetModal({ onClose, onSave, categories, defaultMonth, defaultYear }) {
  const [form, setForm] = useState({ category_id: '', amount: '', month: defaultMonth, year: defaultYear });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/budgets', {
        category_id: parseInt(form.category_id),
        amount: parseFloat(form.amount),
        month: parseInt(form.month),
        year: parseInt(form.year),
      });
      onSave();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? msgs.map(e => e.msg).join(' · ') : (err.response?.data?.error || 'Failed to save budget.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Set Budget</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Category</label>
            <select className="input-field" name="category_id" value={form.category_id} onChange={handleChange} required id="budget-category">
              <option value="">Select a category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Budget Limit ($)</label>
            <input className="input-field" type="number" name="amount" min="1" step="0.01"
              placeholder="200.00" value={form.amount} onChange={handleChange} required id="budget-amount" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Month</label>
              <select className="input-field" name="month" value={form.month} onChange={handleChange} required id="budget-month">
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input-field" name="year" value={form.year} onChange={handleChange} required id="budget-year">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }} id="budget-submit">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getBarColor(pct) {
  if (pct >= 100) return '#ef4444';
  if (pct >= 90) return '#f59e0b';
  if (pct >= 70) return '#f97316';
  return '#10b981';
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, catRes] = await Promise.all([
        api.get(`/budgets/status?month=${month}&year=${year}`),
        api.get('/categories'),
      ]);
      setStatus(statusRes.data.statuses || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overBudget = status.filter(s => s.percentage_used >= 90).length;

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>◎ Budgets</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Track spending limits for {MONTHS[month - 1]} {year}
            {overBudget > 0 && (
              <span style={{ marginLeft: '0.75rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                ⚠ {overBudget} {overBudget === 1 ? 'budget' : 'budgets'} near limit
              </span>
            )}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="set-budget-btn">
          + Set Budget
        </button>
      </div>

      {/* Month / Year selector */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label className="label" style={{ marginBottom: '0.3rem' }}>Month</label>
            <select className="input-field" style={{ width: 140 }} value={month} onChange={e => setMonth(Number(e.target.value))} id="budget-filter-month">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ marginBottom: '0.3rem' }}>Year</label>
            <select className="input-field" style={{ width: 100 }} value={year} onChange={e => setYear(Number(e.target.value))} id="budget-filter-year">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
      ) : status.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem' }}>🎯</p>
          <p style={{ fontWeight: 700, marginTop: '0.75rem', fontSize: '1.1rem' }}>No budgets set yet</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Click "Set Budget" to define spending limits for your categories
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '1.5rem' }}>
            + Set your first budget
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {status.map(item => {
            const pct = Math.min(item.percentage_used, 100);
            const barColor = getBarColor(item.percentage_used);
            const isAlert = item.percentage_used >= 90;

            return (
              <div key={item.budget_id} className="card" style={{
                borderLeft: isAlert ? `3px solid ${barColor}` : '3px solid var(--color-border)',
                transition: 'border-color 0.3s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{item.category_name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {fmt(item.spent)} spent of {fmt(item.limit)} limit
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: barColor }}>
                      {item.percentage_used}%
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {item.remaining >= 0 ? `${fmt(item.remaining)} left` : `${fmt(Math.abs(item.remaining))} over`}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-track">
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: item.percentage_used >= 100
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : item.percentage_used >= 70
                        ? `linear-gradient(90deg, ${barColor}, #ef4444)`
                        : `linear-gradient(90deg, #10b981, ${barColor})`
                  }} />
                </div>

                {/* Alert */}
                {item.alert && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8, fontSize: '0.8rem', color: '#fca5a5', fontWeight: 500
                  }}>
                    {item.alert}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          categories={categories}
          defaultMonth={month}
          defaultYear={year}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

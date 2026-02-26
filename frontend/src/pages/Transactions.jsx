import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const PAGE_SIZE = 10;

function TransactionModal({ onClose, onSave, categories, initial }) {
  const [form, setForm] = useState(initial || {
    amount: '', type: 'expense', category_id: '', date: new Date().toISOString().slice(0, 10), description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: parseInt(form.category_id) };
      if (initial?.id) {
        await api.put(`/transactions/${initial.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSave();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? msgs.map(e => e.msg).join(' · ') : (err.response?.data?.error || 'Failed to save.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{initial?.id ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Type toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {['expense', 'income'].map(t => (
              <button
                key={t} type="button"
                onClick={() => setForm(p => ({ ...p, type: t }))}
                style={{
                  padding: '0.65rem', borderRadius: 10, border: '1px solid',
                  borderColor: form.type === t ? (t === 'income' ? 'var(--color-accent-2)' : 'var(--color-danger)') : 'var(--color-border)',
                  background: form.type === t ? (t === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                  color: form.type === t ? (t === 'income' ? 'var(--color-accent-2)' : 'var(--color-danger)') : 'var(--color-text-muted)',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                  fontFamily: 'var(--font-main)'
                }}
              >
                {t === 'income' ? '💵 Income' : '💸 Expense'}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Amount ($)</label>
            <input className="input-field" type="number" name="amount" min="0.01" step="0.01"
              placeholder="0.00" value={form.amount} onChange={handleChange} required id="tx-amount" />
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input-field" name="category_id" value={form.category_id} onChange={handleChange} required id="tx-category">
              <option value="">Select a category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input className="input-field" type="date" name="date" value={form.date} onChange={handleChange} required id="tx-date" />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <input className="input-field" type="text" name="description" placeholder="What was this for?"
              value={form.description} onChange={handleChange} id="tx-description" />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }} id="tx-submit">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : (initial?.id ? 'Update' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let q = '?';
      if (filterMonth) q += `month=${filterMonth}&`;
      if (filterYear) q += `year=${filterYear}&`;
      if (filterCat) q += `category_id=${filterCat}&`;

      const [txRes, catRes] = await Promise.all([
        api.get(`/transactions${q}`),
        api.get('/categories')
      ]);
      setTransactions(txRes.data.transactions || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterCat]);

  useEffect(() => { fetchData(); setPage(1); }, [fetchData]);

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    fetchData();
  }

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const visible = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>💸 Transactions</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {transactions.length} total records
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }} id="add-transaction-btn">
          + New Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="label" style={{ marginBottom: '0.3rem' }}>Month</label>
            <select className="input-field" style={{ width: 120 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} id="filter-month">
              <option value="">All</option>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(2000, i); return (
                  <option key={i + 1} value={i + 1}>{d.toLocaleString('default', { month: 'long' })}</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="label" style={{ marginBottom: '0.3rem' }}>Year</label>
            <select className="input-field" style={{ width: 100 }} value={filterYear} onChange={e => setFilterYear(e.target.value)} id="filter-year">
              <option value="">All</option>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ marginBottom: '0.3rem' }}>Category</label>
            <select className="input-field" style={{ width: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)} id="filter-category">
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {(filterMonth || filterYear || filterCat) && (
            <button className="btn-ghost" onClick={() => { setFilterMonth(''); setFilterYear(''); setFilterCat(''); }}>
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>
            <p style={{ fontSize: '2.5rem' }}>📭</p>
            <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>No transactions found</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Add your first transaction to get started</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Date', 'Description', 'Category', 'Type', 'Amount', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '0.875rem 1.25rem', textAlign: h === 'Amount' || h === 'Actions' ? 'right' : 'left',
                      fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((tx, i) => (
                  <tr key={tx.id} style={{
                    borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                      {tx.description || <span style={{ color: 'var(--color-text-dim)', fontStyle: 'italic' }}>No description</span>}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {tx.category_name || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge-${tx.type}`}>{tx.type}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700, fontSize: '0.9rem',
                      color: tx.type === 'income' ? 'var(--color-accent-2)' : 'var(--color-danger)' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount))}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn-edit" onClick={() => { setEditTx(tx); setShowModal(true); }}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(tx.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)'
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, transactions.length)} of {transactions.length}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 1}
                    style={{ padding: '0.5rem 0.875rem', opacity: page === 1 ? 0.4 : 1 }}>
                    ← Prev
                  </button>
                  <span style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                    {page} / {totalPages}
                  </span>
                  <button className="btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                    style={{ padding: '0.5rem 0.875rem', opacity: page === totalPages ? 0.4 : 1 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <TransactionModal
          categories={categories}
          initial={editTx ? { ...editTx, amount: parseFloat(editTx.amount), category_id: editTx.category_id } : null}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSave={() => { setShowModal(false); setEditTx(null); fetchData(); }}
        />
      )}
    </div>
  );
}

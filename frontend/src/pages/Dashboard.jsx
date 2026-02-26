import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

const now = new Date();
const CUR_MONTH = now.getMonth() + 1;
const CUR_YEAR = now.getFullYear();

function SummaryCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem', color }}>{value}</p>
          {sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.25rem' }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: '12px',
          background: `${color}1a`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem'
        }}>{icon}</div>
      </div>
    </div>
  );
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = `?month=${CUR_MONTH}&year=${CUR_YEAR}`;
    Promise.all([
      api.get(`/analytics/summary${q}`),
      api.get(`/analytics/category-breakdown${q}`),
      api.get(`/analytics/trends${q}`),
      api.get('/transactions'),
    ]).then(([sumRes, catRes, trendRes, txRes]) => {
      setSummary(sumRes.data);
      setBreakdown(catRes.data.breakdown || []);
      setTrends(trendRes.data.trends || []);
      setRecent((txRes.data.transactions || []).slice(0, 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      </div>
    );
  }

  const month = new Date(CUR_YEAR, CUR_MONTH - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Good {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Here's your financial summary for <strong style={{ color: 'var(--color-text)' }}>{month}</strong>
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        <SummaryCard
          label="Total Income" icon="💚"
          value={fmt(summary?.total_income ?? 0)}
          color="var(--color-accent-2)"
          sub="Money earned this month"
        />
        <SummaryCard
          label="Total Expenses" icon="🔴"
          value={fmt(summary?.total_expenses ?? 0)}
          color="var(--color-danger)"
          sub="Money spent this month"
        />
        <SummaryCard
          label="Balance" icon="⚖️"
          value={fmt(summary?.balance ?? 0)}
          color={summary?.balance >= 0 ? 'var(--color-accent-2)' : 'var(--color-danger)'}
          sub={summary?.balance >= 0 ? "You're in the green" : "Spending exceeds income"}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* Pie Chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            🍩 Expense Breakdown
          </h3>
          {breakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-dim)' }}>
              <p style={{ fontSize: '2rem' }}>📭</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>No expenses recorded yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={breakdown} dataKey="total" nameKey="category"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    paddingAngle={3}
                  >
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}
                    labelStyle={{ color: 'var(--color-text)' }}
                    formatter={(v) => fmt(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {breakdown.slice(0, 5).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-muted)', flex: 1 }}>{item.category}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Area / Trends Chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            📈 Spending Trend
          </h3>
          {trends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-dim)' }}>
              <p style={{ fontSize: '2rem' }}>📭</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>No spending data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends.map(t => ({ ...t, day: t.date?.slice(8, 10) }))}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-text-dim)" fontSize={11} />
                <YAxis stroke="var(--color-text-dim)" fontSize={11} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}
                  formatter={(v) => [fmt(v), 'Spent']}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🕐 Recent Activity</h3>
          <a href="/transactions" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
            View all →
          </a>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-dim)' }}>
            <p style={{ fontSize: '2rem' }}>📭</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>No transactions yet. Add your first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recent.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.75rem',
                background: 'var(--color-surface-2)',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '10px',
                  background: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0
                }}>
                  {tx.type === 'income' ? '💵' : '💸'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || tx.category_name || 'Transaction'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.1rem' }}>
                    {tx.category_name} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: tx.type === 'income' ? 'var(--color-accent-2)' : 'var(--color-danger)' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount))}
                  </p>
                  <span className={`badge-${tx.type}`} style={{ marginTop: '0.2rem', display: 'inline-block' }}>
                    {tx.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

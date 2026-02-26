import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0);
}

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [summary, setSummary]     = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends]       = useState([]);
  const [recent, setRecent]       = useState([]);
  const [allTx, setAllTx]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const q = `?month=${month}&year=${year}`;
    try {
      const [sumRes, catRes, trendRes, txRes] = await Promise.all([
        api.get(`/analytics/summary${q}`),
        api.get(`/analytics/category-breakdown${q}`),
        api.get(`/analytics/trends${q}`),
        api.get(`/transactions${q}`),
      ]);
      setSummary(sumRes.data);
      setBreakdown(catRes.data.breakdown || []);
      setTrends(trendRes.data.trends || []);
      const txs = txRes.data.transactions || [];
      setAllTx(txs);
      setRecent(txs.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Month navigation ─────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const n = new Date();
    if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth() + 1)) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  // ── Excel export ─────────────────────────────────────────────────────
  async function exportToExcel() {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // 1. Summary sheet
      const sumRows = [
        ['Cashzi — Monthly Report'],
        [`Period: ${MONTH_NAMES[month - 1]} ${year}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['Metric', 'Amount (USD)'],
        ['Total Income',   parseFloat(summary?.total_income   ?? 0)],
        ['Total Expenses', parseFloat(summary?.total_expenses ?? 0)],
        ['Net Balance',    parseFloat(summary?.balance        ?? 0)],
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(sumRows);
      summaryWS['!cols'] = [{ wch: 22 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

      // 2. Transactions sheet
      if (allTx.length > 0) {
        const txRows = [
          ['Date', 'Type', 'Category', 'Description', 'Amount (USD)'],
          ...allTx.map(t => [
            new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            t.category_name || '',
            t.description || '',
            parseFloat(t.amount),
          ]),
          [],
          ['', '', '', 'Total Income',   parseFloat(summary?.total_income   ?? 0)],
          ['', '', '', 'Total Expenses', parseFloat(summary?.total_expenses ?? 0)],
          ['', '', '', 'Net Balance',    parseFloat(summary?.balance        ?? 0)],
        ];
        const txWS = XLSX.utils.aoa_to_sheet(txRows);
        txWS['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 30 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, txWS, 'Transactions');
      }

      // 3. Category breakdown sheet 
      if (breakdown.length > 0) {
        const catRows = [
          ['Category', 'Total Spent (USD)'],
          ...breakdown.map(b => [b.category, parseFloat(b.total)]),
        ];
        const catWS = XLSX.utils.aoa_to_sheet(catRows);
        catWS['!cols'] = [{ wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, catWS, 'Category Breakdown');
      }

      XLSX.writeFile(wb, `Cashzi_Report_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Good {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Financial summary for <strong style={{ color: 'var(--color-text)' }}>{MONTH_NAMES[month - 1]} {year}</strong>
            {isCurrentMonth && (
              <span style={{ marginLeft: '0.5rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                borderRadius: 6, padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                CURRENT
              </span>
            )}
          </p>
        </div>

        {/* Month nav + export */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={prevMonth}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.85rem' }}>
            ← Prev
          </button>
          <button className="btn-ghost" onClick={nextMonth} disabled={isCurrentMonth}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.85rem', opacity: isCurrentMonth ? 0.4 : 1 }}>
            Next →
          </button>
          <button
            className="btn-primary"
            onClick={exportToExcel}
            disabled={exporting || allTx.length === 0}
            id="export-excel-btn"
            style={{ gap: '0.4rem' }}
          >
            {exporting
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Exporting…</>
              : '⬇ Export Excel'}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        <SummaryCard label="Total Income"   icon="💚" value={fmt(summary?.total_income)}
          color="var(--color-accent-2)" sub="Money earned this month" />
        <SummaryCard label="Total Expenses" icon="🔴" value={fmt(summary?.total_expenses)}
          color="var(--color-danger)" sub="Money spent this month" />
        <SummaryCard label="Net Balance"    icon="⚖️" value={fmt(summary?.balance)}
          color={summary?.balance >= 0 ? 'var(--color-accent-2)' : 'var(--color-danger)'}
          sub={summary?.balance >= 0 ? "You're in the green" : "Spending exceeds income"} />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* Pie */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>🍩 Expense Breakdown</h3>
          {breakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-dim)' }}>
              <p style={{ fontSize: '2rem' }}>📭</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>No expenses recorded</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={breakdown} dataKey="total" nameKey="category"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}
                    formatter={v => fmt(v)}
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

        {/* Area */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>📈 Spending Trend</h3>
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
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-text-dim)" fontSize={11} />
                <YAxis stroke="var(--color-text-dim)" fontSize={11} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}
                  formatter={v => [fmt(v), 'Spent']}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🕐 Recent Activity</h3>
          <a href="/transactions" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-dim)' }}>
            <p style={{ fontSize: '2rem' }}>📭</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>No transactions for this month yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recent.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.75rem', background: 'var(--color-surface-2)',
                borderRadius: 12, border: '1px solid var(--color-border)',
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

      {/* ── End-of-month export reminder ── */}
      {isCurrentMonth && new Date().getDate() >= 25 && (
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: '0.875rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Month-end approaching!</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Download your Excel report before the month resets.
            </p>
          </div>
          <button className="btn-primary" onClick={exportToExcel} disabled={exporting || allTx.length === 0} style={{ flexShrink: 0 }}>
            ⬇ Export Now
          </button>
        </div>
      )}
    </div>
  );
}

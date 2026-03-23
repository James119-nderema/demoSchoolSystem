import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp, DollarSign, BarChart3,
  Activity, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar, Layers, Target, Wallet,
  AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ComposedChart, Line,
} from 'recharts';
import { financeService } from '../../../services/financeService';
import type {
  EnhancedAnalytics,
} from '../../../services/financeService';
import { FinancePageSkeleton } from '../../ui/Skeleton';

/* ═══════════════════════════════════════════════════════════════════════════════
   COLOUR PALETTES
   ═══════════════════════════════════════════════════════════════════════════════ */
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const fmt = (v: number) => {
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`;
  return `KES ${v.toLocaleString()}`;
};
const fmtFull = (v: number) => `KES ${v.toLocaleString()}`;
const pct = (v: number) => `${v.toFixed(1)}%`;

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function FinanceAnalytics() {
  const [data, setData] = useState<EnhancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const pageRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financeService.getEnhancedAnalytics(year);
      setData(result);
    } catch {
      // silent – KPIs will show zero
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);
  const kpi = data?.kpi;

  if (loading) {
    return <FinancePageSkeleton title="Finance Analytics" subtitle="Loading financial insights..." />;
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Finance Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive financial insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={fetchData} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Net Revenue Balance"
          value={fmtFull(kpi?.net_revenue_balance || 0)}
          sub={`Inflow: ${fmt(kpi?.total_inflow_all_time || 0)} • Outflow: ${fmt(kpi?.total_outflow_all_time || 0)}`}
          color="blue"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="Total Expenditure"
          value={fmtFull(kpi?.expenditure_this_year || 0)}
          sub={`Payroll: ${fmt(kpi?.total_payroll || 0)} • Expenses: ${fmt(kpi?.total_expenses_paid || 0)}`}
          color="red"
        />
        <KpiCard
          icon={<Target className="w-5 h-5" />}
          label="Net Position"
          value={fmtFull(kpi?.net_position || 0)}
          sub={`Collection Rate: ${pct(kpi?.collection_rate || 0)}`}
          color={(kpi?.net_position || 0) >= 0 ? 'emerald' : 'red'}
          trend={(kpi?.net_position || 0) >= 0 ? 'up' : 'down'}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="YoY Growth"
          value={`${(kpi?.yoy_growth || 0) >= 0 ? '+' : ''}${pct(kpi?.yoy_growth || 0)}`}
          sub={`Previous year: ${fmt(kpi?.prev_year_revenue || 0)}`}
          color={(kpi?.yoy_growth || 0) >= 0 ? 'emerald' : 'amber'}
          trend={(kpi?.yoy_growth || 0) >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* ─── Second Row KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniKpi label="Total Invoiced" value={fmt(kpi?.total_invoiced || 0)} icon={<Layers className="w-4 h-4 text-blue-500" />} />
        <MiniKpi label="Total Collected" value={fmt(kpi?.total_paid || 0)} icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} />
        <MiniKpi label="Outstanding Fees" value={fmt(kpi?.total_outstanding || 0)} icon={<Clock className="w-4 h-4 text-amber-500" />} />
        <MiniKpi label="Collection Rate" value={pct(kpi?.collection_rate || 0)} icon={<Activity className="w-4 h-4 text-purple-500" />} />
      </div>

      {/* ─── Charts Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Monthly Revenue vs Expense vs Payroll */}
        <ChartCard title="Monthly Revenue vs Expenditure" subtitle="Comparing income, expenses, and payroll by month">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data?.monthly_trend || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" fill="url(#revGrad)" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="payroll" name="Payroll" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Class Fee Collection Comparison */}
        <ChartCard title="Fee Collection by Class" subtitle="Invoiced vs collected per class">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.class_collection || []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="class_name" tick={{ fontSize: 11, fill: '#9CA3AF' }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="invoiced" name="Invoiced" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Payment Method Breakdown */}
        <ChartCard title="Payment Methods" subtitle="Revenue distribution by payment channel">
          <div className="flex items-center gap-4">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data?.payment_methods || []}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="method"
                    stroke="none"
                  >
                    {(data?.payment_methods || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtFull(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {(data?.payment_methods || []).map((m, i) => {
                const total = (data?.payment_methods || []).reduce((s, p) => s + p.value, 0);
                const share = total ? (m.value / total * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 truncate">{m.method}</span>
                        <span className="text-xs text-gray-500">{share.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full" style={{ width: `${share}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{fmtFull(m.value)} · {m.count} txns</p>
                    </div>
                  </div>
                );
              })}
              {(!data?.payment_methods || data.payment_methods.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-6">No payment data</p>
              )}
            </div>
          </div>
        </ChartCard>

        {/* Chart 4: Expense by Category */}
        <ChartCard title="Expense Breakdown by Category" subtitle="Paid vs pending per category">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.expense_by_category || []} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="paid" name="Paid" fill="#10B981" radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[0, 4, 4, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 5: Weekly Collection Trend */}
        <ChartCard title="Weekly Collection Trend" subtitle="Last 12 weeks of fee collection">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data?.weekly_trend || []}>
              <defs>
                <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" name="Collected" fill="url(#weeklyGrad)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 6: Collection Rate by Class (radial) */}
        <ChartCard title="Collection Rate by Class" subtitle="Percentage of invoiced amount collected">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(data?.class_collection || []).slice(0, 9).map((cls, i) => (
              <CollectionRateRing key={i} name={cls.class_name} rate={cls.collection_rate} color={COLORS[i % COLORS.length]} />
            ))}
            {(!data?.class_collection || data.class_collection.length === 0) && (
              <div className="col-span-3 text-center py-10 text-sm text-gray-400">No class data available</div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ─── Top Outstanding Classes Table ────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Top Outstanding Classes
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Classes with the highest unpaid fees</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Invoiced</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Collected</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.top_outstanding || []).map((cls, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{cls.class_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 text-right">{cls.student_count}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 text-right tabular-nums">{fmtFull(cls.invoiced)}</td>
                  <td className="px-5 py-3 text-sm text-emerald-600 font-medium text-right tabular-nums">{fmtFull(cls.paid)}</td>
                  <td className="px-5 py-3 text-sm text-red-600 font-bold text-right tabular-nums">{fmtFull(cls.outstanding)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${cls.collection_rate >= 80 ? 'bg-emerald-50 text-emerald-700'
                        : cls.collection_rate >= 50 ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'}`}>
                      {pct(cls.collection_rate)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.top_outstanding || data.top_outstanding.length === 0) && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No outstanding data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Revenue vs Expenditure Summary Bar ──────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Financial Health Summary
        </h3>
        <div className="space-y-4">
          <HealthBar label="Fee Collection" current={kpi?.total_paid || 0} max={kpi?.total_invoiced || 1} color="#3B82F6" />
          <HealthBar label="Expense Coverage" current={kpi?.total_expenses_paid || 0} max={kpi?.total_expenses || 1} color="#F59E0B" />
          <HealthBar label="Revenue vs Expenditure" current={kpi?.revenue_this_year || 0} max={(kpi?.revenue_this_year || 0) + (kpi?.expenditure_this_year || 0) || 1} color="#10B981" />
        </div>
      </div>

      {/* ─── Unified Revenue Ledger ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Revenue Transaction Ledger</h3>
          <p className="text-xs text-gray-500 mt-0.5">All inflow and outflow transactions with running balance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">In</th>
                <th className="px-4 py-3 text-right">Out</th>
                <th className="px-4 py-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.recent_transactions || []).map((tx) => (
                <tr key={`${tx.source}-${tx.id}`} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(tx.transaction_date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-800">{tx.description}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{tx.source.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{tx.amount_in ? fmtFull(tx.amount_in) : '—'}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{tx.amount_out ? fmtFull(tx.amount_out) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmtFull(tx.running_balance)}</td>
                </tr>
              ))}
              {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transactions available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function KpiCard({ icon, label, value, sub, color, trend }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  color: string; trend?: 'up' | 'down';
}) {
  const bg: Record<string, string> = {
    blue: 'from-blue-600 to-indigo-600',
    red: 'from-red-500 to-rose-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-500',
  };
  return (
    <div className={`bg-gradient-to-br ${bg[color] || bg.blue} rounded-2xl p-5 text-white shadow-lg shadow-${color}-500/10 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-200' : 'text-red-200'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      <p className="text-white/70 text-xs font-medium mb-0.5">{label}</p>
      <p className="text-xl font-extrabold tracking-tight">{value}</p>
      <p className="text-white/60 text-[10px] mt-1">{sub}</p>
    </div>
  );
}

function MiniKpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-sm">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 min-w-[160px]">
      <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-gray-800">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CollectionRateRing({ name, rate, color }: { name: string; rate: number; color: string }) {
  const data = [{ value: rate, fill: color }, { value: 100 - rate, fill: '#f3f4f6' }];
  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-gray-50/50 rounded-xl">
      <div className="w-16 h-16 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={[data[0]]} startAngle={90} endAngle={-270}>
            <RadialBar background dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-gray-700">{rate.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-gray-600 text-center truncate w-full">{name}</span>
    </div>
  );
}

function HealthBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const percent = Math.min((current / max) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs text-gray-500">{fmtFull(current)} / {fmtFull(max)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5 text-right">{percent.toFixed(1)}%</p>
    </div>
  );
}

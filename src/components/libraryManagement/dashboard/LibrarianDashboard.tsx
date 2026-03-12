/**
 * Library Dashboard — Library-specific stats, quick actions,
 * popular books, recent activity
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryDashboard } from '../hooks/useLibrary';

const LibrarianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading, error, refresh } = useLibraryDashboard();

  /* ─── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Library Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
              <div className="space-y-2"><div className="animate-pulse bg-gray-200 rounded h-3 w-20" /><div className="animate-pulse bg-gray-200 rounded h-7 w-12" /></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6"><div className="animate-pulse bg-gray-200 rounded h-4 w-36 mb-4" /><div className="animate-pulse bg-gray-100 rounded h-48" /></div>
          <div className="bg-white rounded-lg shadow p-6"><div className="animate-pulse bg-gray-200 rounded h-4 w-36 mb-4" /><div className="animate-pulse bg-gray-100 rounded h-48" /></div>
        </div>
      </div>
    );
  }

  /* ─── Error ───────────────────────────────────────────────────────────── */
  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <strong>Error:</strong> {error}
        <button onClick={refresh} className="ml-4 underline">Retry</button>
      </div>
    );
  }

  if (!stats) return null;

  /* ─── KPI Cards ───────────────────────────────────────────────────────── */
  const kpis = [
    { label: 'Total Books', value: stats.total_books.toLocaleString(), icon: '📚', light: 'bg-indigo-50', ring: 'ring-indigo-200' },
    { label: 'Total Copies', value: stats.total_copies.toLocaleString(), icon: '📖', light: 'bg-blue-50', ring: 'ring-blue-200' },
    { label: 'Available Copies', value: stats.available_copies.toLocaleString(), icon: '✅', light: 'bg-emerald-50', ring: 'ring-emerald-200' },
    { label: 'Active Loans', value: stats.active_loans.toLocaleString(), icon: '🔄', light: 'bg-amber-50', ring: 'ring-amber-200' },
    { label: 'Overdue', value: stats.overdue_loans.toLocaleString(), icon: '⚠️', light: stats.overdue_loans > 0 ? 'bg-red-50' : 'bg-slate-50', ring: stats.overdue_loans > 0 ? 'ring-red-200' : 'ring-slate-200' },
    { label: 'Total Members', value: stats.total_members.toLocaleString(), icon: '👥', light: 'bg-purple-50', ring: 'ring-purple-200' },
  ];

  const activityIcon = (type: string) => {
    switch (type) {
      case 'issue': return '📤';
      case 'return': return '📥';
      case 'renewal': return '🔄';
      case 'fine_paid': return '💰';
      case 'book_added': return '➕';
      default: return '📋';
    }
  };

  const activityColor = (type: string) => {
    switch (type) {
      case 'issue': return 'bg-blue-50 text-blue-700';
      case 'return': return 'bg-green-50 text-green-700';
      case 'renewal': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Library Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of library operations and resources</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow ring-1 ${kpi.ring}`}>
            <div className={`w-10 h-10 ${kpi.light} rounded-lg flex items-center justify-center text-xl mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Today's summary + Fines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">📤</div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.issues_today}</p>
            <p className="text-xs text-slate-500">Books Issued Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">📥</div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.returns_today}</p>
            <p className="text-xs text-slate-500">Books Returned Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl">💰</div>
          <div>
            <p className="text-2xl font-bold text-slate-800">KES {stats.pending_fines.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Pending Fines</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/library/borrowing')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Issue Book
          </button>
          <button onClick={() => navigate('/library/borrowing')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
            Return Book
          </button>
          <button onClick={() => navigate('/library/catalog')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search Catalog
          </button>
          <button onClick={() => navigate('/library/catalog')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add New Book
          </button>
          <button onClick={() => navigate('/library/members')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Members
          </button>
          <button onClick={() => navigate('/library/reports')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            View Reports
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Books */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">📈 Most Borrowed Books</h3>
          {stats.popular_books.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No borrowing data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.popular_books.map((book, idx) => {
                const maxCount = stats.popular_books[0]?.borrow_count || 1;
                const pct = (book.borrow_count / maxCount) * 100;
                return (
                  <div key={book.book_id || idx} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-5 text-right">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-700 truncate mr-2 font-medium">{book.title}</span>
                        <span className="text-xs font-semibold text-indigo-600">{book.borrow_count} borrows</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">🕐 Recent Activity</h3>
          {stats.recent_activity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recent_activity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${activityColor(act.type)}`}>
                    {activityIcon(act.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700">{act.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Borrowing by Grade and Learning Area */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Grade */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">📊 Borrowing by Class</h3>
          {stats.borrowing_by_grade.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.borrowing_by_grade.map((item, idx) => {
                const maxCount = stats.borrowing_by_grade[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={String(item.grade) + idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.grade}</span>
                      <span className="text-xs font-semibold text-slate-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Learning Area */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">📖 Borrowing by Subject</h3>
          {stats.borrowing_by_learning_area.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.borrowing_by_learning_area.map((item, idx) => {
                const maxCount = stats.borrowing_by_learning_area[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={String(item.area) + idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.area}</span>
                      <span className="text-xs font-semibold text-slate-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Books Added This Month */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">📗 New Acquisitions This Month</h3>
          <span className="text-2xl font-bold text-indigo-600">{stats.books_added_this_month}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">books added to the catalog this month</p>
      </div>
    </div>
  );
};

export default LibrarianDashboard;

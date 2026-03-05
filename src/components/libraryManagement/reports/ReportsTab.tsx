/**
 * Reports Tab — Circulation, Inventory, Overdue, Popular Books,
 * all with CBC learning-area and grade-level breakdowns.
 */

import React, { useState, useEffect } from 'react';
import { useLibraryReports } from '../hooks/useLibrary';

type ReportView = 'circulation' | 'inventory' | 'overdue' | 'popular';

const ReportsTab: React.FC = () => {
  const { circulationStats, popularBooks, inventory, overdueReport, loading, fetchCirculation, fetchPopular, fetchInventory, fetchOverdueReport } = useLibraryReports();
  const [activeReport, setActiveReport] = useState<ReportView>('circulation');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchCirculation();
    fetchPopular();
    fetchOverdueReport();
    fetchInventory();
  }, []);

  const reports = [
    { key: 'circulation' as const, label: 'Circulation Report', icon: '📊' },
    { key: 'inventory' as const, label: 'Inventory / Stocktaking', icon: '📦' },
    { key: 'overdue' as const, label: 'Overdue Report', icon: '⚠️' },
    { key: 'popular' as const, label: 'Popular Books', icon: '🌟' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Reports &amp; Analytics</h2>
        <p className="text-sm text-slate-500">Library performance analytics with CBC insights</p>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2">
        {reports.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveReport(r.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeReport === r.key
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{r.icon}</span>
            {r.label}
          </button>
        ))}
      </div>

      {/* Circulation Report */}
      {activeReport === 'circulation' && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Start Date</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">End Date</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <button onClick={() => fetchCirculation(dateRange.start && dateRange.end ? { start: dateRange.start, end: dateRange.end } : undefined)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Apply</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : circulationStats ? (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Issued', value: circulationStats.total_issued, color: 'indigo' },
                  { label: 'Total Returned', value: circulationStats.total_returned, color: 'emerald' },
                  { label: 'Currently Borrowed', value: circulationStats.currently_borrowed, color: 'blue' },
                  { label: 'Total Overdue', value: circulationStats.overdue_count, color: 'red' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className={`text-2xl font-bold text-${c.color}-600`}>{c.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* By Learning Area */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Circulation by Learning Area</h3>
                {circulationStats.by_learning_area.length === 0 ? (
                  <p className="text-xs text-slate-400">No data for selected period.</p>
                ) : (
                  <div className="space-y-2">
                    {circulationStats.by_learning_area.map(item => {
                      const max = Math.max(...circulationStats.by_learning_area.map(i => i.count));
                      return (
                        <div key={item.learning_area} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-40 truncate">{item.learning_area}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${(item.count / max) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-10 text-right">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* By Grade */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Circulation by Grade Level</h3>
                {circulationStats.by_grade.length === 0 ? (
                  <p className="text-xs text-slate-400">No data for selected period.</p>
                ) : (
                  <div className="space-y-2">
                    {circulationStats.by_grade.map(item => {
                      const max = Math.max(...circulationStats.by_grade.map(i => i.count));
                      return (
                        <div key={item.grade} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-20">{item.grade}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(item.count / max) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-10 text-right">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fine collected */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Fines Collected</h3>
                <p className="text-2xl font-bold text-amber-600">KES {circulationStats.fines_collected.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Total fines collected in the selected period</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-slate-200 text-slate-500">
              <p className="text-sm">No circulation data available.</p>
            </div>
          )}
        </div>
      )}

      {/* Inventory / Stocktaking Report */}
      {activeReport === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Inventory Report (KICD Aligned)</h3>
              <p className="text-xs text-slate-500 mt-1">Stocktaking report grouped by learning area</p>
            </div>
            <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Export CSV</button>
          </div>
          {inventory.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No inventory data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">ISBN</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Learning Area</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Available</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Borrowed</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map(item => (
                    <tr key={item.book_id}>
                      <td className="px-4 py-2 text-sm text-slate-800">{item.title}</td>
                      <td className="px-4 py-2 text-xs text-slate-500 font-mono">{item.isbn || '—'}</td>
                      <td className="px-4 py-2 text-xs text-slate-600">{item.learning_area}</td>
                      <td className="px-4 py-2 text-sm text-center font-medium text-slate-700">{item.total_copies}</td>
                      <td className="px-4 py-2 text-sm text-center font-medium text-emerald-600">{item.available_copies}</td>
                      <td className="px-4 py-2 text-sm text-center font-medium text-blue-600">{item.borrowed_copies}</td>
                      <td className="px-4 py-2 text-xs text-slate-600">{item.condition_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overdue Report */}
      {activeReport === 'overdue' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">⚠️ Overdue Books Report</h3>
              <p className="text-xs text-slate-500 mt-1">{overdueReport.length} overdue item{overdueReport.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Send Reminders</button>
          </div>
          {overdueReport.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">🎉 No overdue books!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Book</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Member</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Due Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Days Overdue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Fine (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueReport.map(item => (
                    <tr key={item.borrowing_id} className="hover:bg-red-50/30">
                      <td className="px-4 py-2 text-sm text-slate-800">{item.book_title}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{item.member_name}</td>
                      <td className="px-4 py-2 text-sm text-red-600 font-medium">{new Date(item.due_date).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-2 text-sm text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.days_overdue > 14 ? 'bg-red-100 text-red-700' :
                          item.days_overdue > 7 ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.days_overdue} days
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-amber-600">{item.fine_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Popular Books */}
      {activeReport === 'popular' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">🌟 Most Borrowed Books</h3>
            {popularBooks.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No borrowing data to rank.</p>
            ) : (
              <div className="space-y-3">
                {popularBooks.map((book, idx) => {
                  const maxCount = Math.max(...popularBooks.map(b => b.borrow_count));
                  return (
                    <div key={book.book_id} className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{book.title}</p>
                        <p className="text-xs text-slate-500">{book.learning_area} • {book.grade_level}</p>
                      </div>
                      <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(book.borrow_count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-12 text-right">{book.borrow_count}x</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;

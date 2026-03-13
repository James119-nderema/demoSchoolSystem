import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { libraryService } from '../services/libraryService';
import type { BorrowingRecord } from '../types';

const LostBooksPage: React.FC = () => {
  const [lostBooks, setLostBooks] = useState<BorrowingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const fetchLostBooks = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryService.getBorrowings({
        page_size: '10000',
        status: 'lost',
        ...(query ? { search: query } : {}),
      });
      setLostBooks(data.results || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lost books');
      setLostBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLostBooks();
  }, [fetchLostBooks]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLostBooks(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchLostBooks]);

  const totalEstimatedValue = useMemo(
    () => lostBooks
      .filter(item => paymentFilter === 'all' ? true : paymentFilter === 'paid' ? item.fine_status === 'paid' : item.fine_status === 'pending')
      .reduce((sum, item) => sum + (Number(item.book?.price) || 0), 0),
    [lostBooks, paymentFilter],
  );

  const affectedMembers = useMemo(() => {
    const ids = new Set(
      lostBooks
        .filter(item => paymentFilter === 'all' ? true : paymentFilter === 'paid' ? item.fine_status === 'paid' : item.fine_status === 'pending')
        .map(item => item.member?.id)
        .filter(Boolean),
    );
    return ids.size;
  }, [lostBooks, paymentFilter]);

  const filteredLostBooks = useMemo(
    () => lostBooks.filter(item => {
      if (paymentFilter === 'paid') return item.fine_status === 'paid';
      if (paymentFilter === 'unpaid') return item.fine_status === 'pending';
      return true;
    }),
    [lostBooks, paymentFilter],
  );

  const handleMarkPaid = async (record: BorrowingRecord) => {
    if (record.fine_status === 'paid') return;
    setPayingId(record.id);
    setActionMessage(null);
    try {
      const payableAmount = Number(record.book?.price || record.fine_amount || 0);
      await libraryService.payFine(record.id, payableAmount);
      setLostBooks(prev => prev.map(item => item.id === record.id ? { ...item, fine_status: 'paid' } : item));
      setActionMessage({ type: 'success', text: 'Payment status updated to paid.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to mark as paid' });
    } finally {
      setPayingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lost Books</h2>
          <p className="text-sm text-slate-500">All books marked as lost in borrowing records</p>
        </div>

        <div className="w-full md:w-80">
          <label className="mb-1 block text-xs text-slate-500">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, member, admission, or copy UID"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="w-full md:w-56">
          <label className="mb-1 block text-xs text-slate-500">Payment Filter</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {actionMessage && (
        <div className={`rounded-lg px-4 py-3 text-sm ${actionMessage.type === 'success' ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Lost Books</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{filteredLostBooks.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Affected Members</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{affectedMembers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Estimated Value (KES)</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{totalEstimatedValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : filteredLostBooks.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No lost books found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Book</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Member</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Copy UID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Issue Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Marked Lost</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Payment</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Price (KES)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Fine (KES)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLostBooks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{item.book?.title || '—'}</p>
                      <p className="text-xs text-slate-500">{item.book?.author || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{item.member?.full_name || '—'}</p>
                      <p className="text-xs text-slate-500">{item.member?.admission_number || item.member?.staff_id || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-700">{item.copy_uid || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDate(item.issue_date)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{formatDate(item.return_date)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.fine_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.fine_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-amber-700">{Number(item.book?.price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">{Number(item.fine_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleMarkPaid(item)}
                        disabled={item.fine_status === 'paid' || payingId === item.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {payingId === item.id ? 'Updating...' : item.fine_status === 'paid' ? 'Paid' : 'Mark Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LostBooksPage;

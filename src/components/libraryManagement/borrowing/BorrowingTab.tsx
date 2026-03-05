/**
 * Borrowing Tab — Issue, return, renew books; view active loans and overdue list
 * Issue modal supports choosing student or teacher/staff with search by adm no or name
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useBorrowing } from '../hooks/useLibrary';
import { BORROWING_STATUS_LABELS, BOOK_CONDITIONS, DEFAULT_LIBRARY_SETTINGS } from '../constants/cbcConstants';
import { APIService } from '../../../services/baseUrl';
import type { BorrowingRecord, IssueBorrowingData, BookCondition } from '../types';

interface StudentSearchResult {
  id: string;
  full_name: string;
  admission_number: string;
  current_class: string;
}

interface StaffSearchResult {
  id: string;
  full_name: string;
  staff_number: string;
  role: string;
}

interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
}

const BorrowingTab: React.FC = () => {
  const { borrowings, loading, issueBook, returnBook, renewBook } = useBorrowing();

  const [activeView, setActiveView] = useState<'active' | 'overdue' | 'all'>('active');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingRecord | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Issue form state
  const [issueForm, setIssueForm] = useState<IssueBorrowingData>({
    book_id: '', member_id: '', member_type: 'student',
    due_date: new Date(Date.now() + DEFAULT_LIBRARY_SETTINGS.default_loan_days_student * 86400000).toISOString().split('T')[0],
  });

  // Member type & search state
  const [memberType, setMemberType] = useState<'student' | 'staff'>('student');
  const [memberSearch, setMemberSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
  const [staffResults, setStaffResults] = useState<StaffSearchResult[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; identifier: string } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Book search state — server-side
  const [bookSearch, setBookSearch] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ id: string; title: string; author: string; available: number } | null>(null);
  const bookSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Return form state
  const [returnCondition, setReturnCondition] = useState<BookCondition>('good');
  const [returnNotes, setReturnNotes] = useState('');

  // Debounced member search
  const searchMembers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setStudentResults([]);
      setStaffResults([]);
      return;
    }
    setSearchingMembers(true);
    try {
      if (memberType === 'student') {
        const data = await APIService.get<{ results: StudentSearchResult[] }>(
          '/api/students/', { search: query, page_size: '15' }, 'staff'
        );
        setStudentResults(data.results || []);
      } else {
        const data = await APIService.get<{ results: StaffSearchResult[] }>(
          '/api/teachers/', { search: query, page_size: '15' }, 'staff'
        );
        setStaffResults(data.results || []);
      }
    } catch {
      setStudentResults([]);
      setStaffResults([]);
    } finally {
      setSearchingMembers(false);
    }
  }, [memberType]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchMembers(memberSearch), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [memberSearch, searchMembers]);

  // Reset member selection when type changes
  useEffect(() => {
    setSelectedMember(null);
    setMemberSearch('');
    setStudentResults([]);
    setStaffResults([]);
    setIssueForm(prev => ({ ...prev, member_id: '', member_type: memberType }));
  }, [memberType]);

  const selectMember = (id: string, name: string, identifier: string) => {
    setSelectedMember({ id, name, identifier });
    setIssueForm(prev => ({ ...prev, member_id: id }));
    setMemberSearch('');
    setStudentResults([]);
    setStaffResults([]);
  };

  // Debounced server-side book search
  const searchBooks = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      // If no query, fetch first batch of available books
      if (!query) {
        try {
          setSearchingBooks(true);
          const data = await APIService.get<{ results: BookSearchResult[] }>(
            '/api/library/books/', { page_size: '50', available: 'true' }, 'staff'
          );
          setBookResults((data.results || []).filter(b => b.available_copies > 0));
        } catch { setBookResults([]); }
        finally { setSearchingBooks(false); }
      } else {
        setBookResults([]);
      }
      return;
    }
    setSearchingBooks(true);
    try {
      const data = await APIService.get<{ results: BookSearchResult[] }>(
        '/api/library/books/', { search: query, page_size: '50' }, 'staff'
      );
      setBookResults((data.results || []).filter(b => b.available_copies > 0));
    } catch {
      setBookResults([]);
    } finally {
      setSearchingBooks(false);
    }
  }, []);

  useEffect(() => {
    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);
    bookSearchTimeoutRef.current = setTimeout(() => searchBooks(bookSearch), 300);
    return () => { if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current); };
  }, [bookSearch, searchBooks]);

  // Load initial books when the issue modal opens
  useEffect(() => {
    if (showIssueModal && bookResults.length === 0 && !selectedBook) {
      searchBooks('');
    }
  }, [showIssueModal, bookResults.length, selectedBook, searchBooks]);

  const selectBook = (book: BookSearchResult) => {
    setSelectedBook({ id: book.id, title: book.title, author: book.author, available: book.available_copies });
    setIssueForm(prev => ({ ...prev, book_id: book.id }));
    setBookSearch('');
    setBookResults([]);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.book_id || !issueForm.member_id) {
      setMessage({ type: 'error', text: 'Please select a book and a member' });
      return;
    }
    setSubmitting(true);
    try {
      await issueBook(issueForm);
      setShowIssueModal(false);
      setIssueForm({ book_id: '', member_id: '', member_type: 'student', due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] });
      setSelectedMember(null);
      setSelectedBook(null);
      setBookSearch('');
      setBookResults([]);
      setMessage({ type: 'success', text: 'Book issued successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to issue book' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedBorrowing) return;
    setSubmitting(true);
    try {
      await returnBook({
        borrowing_id: selectedBorrowing.id,
        condition_on_return: returnCondition,
        notes: returnNotes,
      });
      setShowReturnModal(false);
      setSelectedBorrowing(null);
      setReturnNotes('');
      setMessage({ type: 'success', text: 'Book returned successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to return book' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (record: BorrowingRecord) => {
    if (record.renewals_count >= record.max_renewals) {
      setMessage({ type: 'error', text: 'Maximum renewals reached for this book.' });
      return;
    }
    try {
      await renewBook(record.id);
      setMessage({ type: 'success', text: 'Book renewed successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to renew book' });
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const filteredBorrowings = activeView === 'active'
    ? borrowings.filter(b => b.status === 'active' || b.status === 'renewed')
    : activeView === 'overdue'
    ? borrowings.filter(b => b.status === 'overdue')
    : borrowings;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Borrowing & Returns</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowIssueModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Issue Book
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
          <button className="ml-3 underline text-xs" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['active', 'overdue', 'all'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === view ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {view === 'active' ? `Active (${borrowings.filter(b => b.status === 'active' || b.status === 'renewed').length})`
              : view === 'overdue' ? `Overdue (${borrowings.filter(b => b.status === 'overdue').length})`
              : `All (${borrowings.length})`}
          </button>
        ))}
      </div>

      {/* Borrowing Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
      ) : filteredBorrowings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No borrowing records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Issued</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fine</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBorrowings.map(record => {
                  const statusInfo = BORROWING_STATUS_LABELS[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{record.book.title}</p>
                        <p className="text-xs text-slate-500">{record.book.isbn}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-800">{record.member.full_name}</p>
                        <p className="text-xs text-slate-500">{record.member.admission_number || record.member.staff_id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(record.issue_date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(record.due_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {record.fine_amount > 0 ? (
                          <span className="text-sm font-medium text-red-600">KES {record.fine_amount}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {(record.status === 'active' || record.status === 'overdue' || record.status === 'renewed') && (
                            <>
                              <button
                                onClick={() => { setSelectedBorrowing(record); setShowReturnModal(true); }}
                                className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                              >Return</button>
                              {record.renewals_count < record.max_renewals && (
                                <button
                                  onClick={() => handleRenew(record)}
                                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                >Renew</button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Issue Book</h3>
              <button onClick={() => { setShowIssueModal(false); setSelectedMember(null); setSelectedBook(null); setBookSearch(''); setBookResults([]); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleIssue} className="p-6 space-y-4">
              {/* Book Selection with server-side search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Book *</label>
                {selectedBook ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-indigo-800">{selectedBook.title}</p>
                      <p className="text-xs text-indigo-600">{selectedBook.author} • {selectedBook.available} available</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedBook(null); setIssueForm(prev => ({ ...prev, book_id: '' })); searchBooks(''); }}
                      className="text-indigo-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Search by title, ISBN, or author..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {searchingBooks && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                    {bookResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {bookResults.map(b => (
                          <button
                            key={b.id} type="button"
                            onClick={() => selectBook(b)}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800">{b.title}</p>
                            <p className="text-xs text-slate-500">{b.author} • ISBN: {b.isbn} • {b.available_copies} available</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {!searchingBooks && bookSearch.length >= 2 && bookResults.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">No available books found matching "{bookSearch}"</p>
                    )}
                  </div>
                )}
                <input type="hidden" required value={issueForm.book_id} />
              </div>

              {/* Member Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Issue To *</label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-3">
                  <button
                    type="button"
                    onClick={() => setMemberType('student')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      memberType === 'student' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >Student</button>
                  <button
                    type="button"
                    onClick={() => setMemberType('staff')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      memberType === 'staff' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >Teacher / Staff</button>
                </div>

                {/* Selected member display */}
                {selectedMember ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-indigo-800">{selectedMember.name}</p>
                      <p className="text-xs text-indigo-600">{selectedMember.identifier}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedMember(null); setIssueForm(prev => ({ ...prev, member_id: '' })); }}
                      className="text-indigo-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder={memberType === 'student' ? 'Search by admission number or name...' : 'Search by staff number or name...'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {searchingMembers && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}

                    {/* Search results dropdown */}
                    {memberType === 'student' && studentResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {studentResults.map(s => (
                          <button
                            key={s.id} type="button"
                            onClick={() => selectMember(s.id, s.full_name, `Adm: ${s.admission_number} • ${s.current_class}`)}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                            <p className="text-xs text-slate-500">Adm: {s.admission_number} • {s.current_class}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {memberType === 'staff' && staffResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {staffResults.map(s => (
                          <button
                            key={s.id} type="button"
                            onClick={() => selectMember(s.id, s.full_name, `Staff#: ${s.staff_number} • ${s.role}`)}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                            <p className="text-xs text-slate-500">Staff#: {s.staff_number} • {s.role}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {memberSearch.length >= 2 && !searchingMembers && (
                      (memberType === 'student' && studentResults.length === 0) ||
                      (memberType === 'staff' && staffResults.length === 0)
                    ) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-center">
                        <p className="text-xs text-slate-500">No {memberType === 'student' ? 'students' : 'staff'} found matching "{memberSearch}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input type="date" value={issueForm.due_date} onChange={(e) => setIssueForm(prev => ({ ...prev, due_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={issueForm.notes || ''} onChange={(e) => setIssueForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowIssueModal(false); setSelectedMember(null); setBookSearch(''); }} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting || !issueForm.member_id} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Issuing...' : 'Issue Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedBorrowing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Return Book</h3>
              <button onClick={() => { setShowReturnModal(false); setSelectedBorrowing(null); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium text-slate-800">{selectedBorrowing.book.title}</p>
                <p className="text-xs text-slate-500">Borrowed by: {selectedBorrowing.member.full_name}</p>
                <p className="text-xs text-slate-500">Due: {formatDate(selectedBorrowing.due_date)}</p>
                {selectedBorrowing.fine_amount > 0 && (
                  <p className="text-xs text-red-600 font-medium mt-1">Outstanding fine: KES {selectedBorrowing.fine_amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition on Return</label>
                <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as BookCondition)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  {BOOK_CONDITIONS.filter(c => c.value !== 'lost').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowReturnModal(false); setSelectedBorrowing(null); }} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-medium">Cancel</button>
                <button onClick={handleReturn} disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowingTab;

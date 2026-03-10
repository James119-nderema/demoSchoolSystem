/**
 * BookCopyManager — Manage unique identifiers for each physical copy of a book.
 * Each copy gets a unique char identifier. Number of copies cannot exceed total_copies.
 * Supports single add and bulk upload (comma / newline separated).
 * Identifiers are persisted in the backend (library_book_copies table).
 */

import React, { useState } from 'react';
import { useBookCopies } from '../hooks/useLibrary';
import type { Book } from '../types';

interface Props {
  book: Book;
  onClose: () => void;
  onBorrow?: (book: Book) => void;
}

const BookCopyManager: React.FC<Props> = ({ book, onClose, onBorrow }) => {
  const { copies, loading, error, addCopy, deleteCopy } = useBookCopies(book.id);
  const [newCopyUid, setNewCopyUid] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [addError, setAddError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ added: number; failed: string[]; total: number } | null>(null);

  const canAddMore = copies.length < book.total_copies;
  const remainingSlots = book.total_copies - copies.length;
  const availableCopyCount = copies.filter(c => c.is_available).length;

  const isDuplicate = (uid: string) => copies.some(c => c.copy_uid.toLowerCase() === uid.toLowerCase());

  // ── Single add ────────────────────────────────────────────────────────
  const handleAddCopy = async () => {
    const uid = newCopyUid.trim();
    if (!uid) {
      setAddError('Please enter a unique identifier');
      return;
    }
    if (isDuplicate(uid)) {
      setAddError('This identifier already exists for this book');
      return;
    }
    if (!canAddMore) {
      setAddError(`Cannot exceed ${book.total_copies} total copies`);
      return;
    }
    setAddError('');
    setSubmitting(true);
    try {
      await addCopy({ book_id: book.id, copy_uid: uid });
      setNewCopyUid('');
    } catch (err: any) {
      setAddError(err?.error || err?.message || 'Failed to add copy');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Bulk add ──────────────────────────────────────────────────────────
  const parseBulkIds = (text: string): string[] => {
    return text
      .split(/[,\n\r;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const handleBulkAdd = async () => {
    const ids = parseBulkIds(bulkText);
    if (ids.length === 0) {
      setAddError('Please enter at least one identifier');
      return;
    }

    // Check for duplicates within the pasted list itself
    const seen = new Set<string>();
    const uniqueIds: string[] = [];
    for (const id of ids) {
      const lower = id.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueIds.push(id);
      }
    }

    if (uniqueIds.length > remainingSlots) {
      setAddError(`Only ${remainingSlots} slot(s) remaining but ${uniqueIds.length} identifiers provided`);
      return;
    }

    setAddError('');
    setSubmitting(true);
    setBulkProgress({ added: 0, failed: [], total: uniqueIds.length });

    let addedCount = 0;
    const failedIds: string[] = [];

    for (const uid of uniqueIds) {
      if (isDuplicate(uid)) {
        failedIds.push(`${uid} (duplicate)`);
        continue;
      }
      try {
        await addCopy({ book_id: book.id, copy_uid: uid });
        addedCount++;
        setBulkProgress({ added: addedCount, failed: failedIds, total: uniqueIds.length });
      } catch (err: any) {
        failedIds.push(`${uid} (${err?.error || 'failed'})`);
      }
    }

    setBulkProgress({ added: addedCount, failed: failedIds, total: uniqueIds.length });
    if (addedCount > 0) setBulkText('');
    if (failedIds.length > 0) {
      setAddError(`${addedCount} added, ${failedIds.length} failed: ${failedIds.join(', ')}`);
    }
    setSubmitting(false);
  };

  const handleDeleteCopy = async (copy: { id: string; is_available: boolean }) => {
    if (!copy.is_available) return;
    setDeletingId(copy.id);
    try {
      await deleteCopy(copy.id);
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && addMode === 'single') {
      e.preventDefault();
      handleAddCopy();
    }
  };

  const bulkPreviewIds = parseBulkIds(bulkText);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Manage Book Copies</h3>
            <p className="text-sm text-slate-500 mt-0.5">{book.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Book Info Summary */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Total Copies</p>
              <p className="text-lg font-bold text-slate-800">{book.total_copies}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">IDs Assigned</p>
              <p className="text-lg font-bold text-indigo-600">{copies.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Available</p>
              <p className="text-lg font-bold text-emerald-600">{availableCopyCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Borrowed</p>
              <p className="text-lg font-bold text-amber-600">{copies.filter(c => !c.is_available).length}</p>
            </div>
          </div>
        </div>

        {/* Add Copy IDs — Single / Bulk toggle */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">Add Copy Identifier{addMode === 'bulk' ? 's' : ''}</label>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => { setAddMode('single'); setAddError(''); setBulkProgress(null); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  addMode === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >Single</button>
              <button
                type="button"
                onClick={() => { setAddMode('bulk'); setAddError(''); setBulkProgress(null); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  addMode === 'bulk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >Bulk Upload</button>
            </div>
          </div>

          {addMode === 'single' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCopyUid}
                onChange={(e) => { setNewCopyUid(e.target.value); setAddError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. MAT-001-A"
                disabled={!canAddMore || submitting}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
              <button
                onClick={handleAddCopy}
                disabled={!canAddMore || submitting || !newCopyUid.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {submitting ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Adding...
                  </span>
                ) : 'Add'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={bulkText}
                onChange={(e) => { setBulkText(e.target.value); setAddError(''); setBulkProgress(null); }}
                placeholder={"Paste multiple IDs separated by commas, semicolons, or new lines:\nMAT-001-A\nMAT-001-B\nMAT-001-C"}
                disabled={!canAddMore || submitting}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {bulkPreviewIds.length > 0 ? (
                    <span>{bulkPreviewIds.length} identifier{bulkPreviewIds.length !== 1 ? 's' : ''} detected • {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining</span>
                  ) : (
                    <span>Separate IDs with commas, semicolons, or new lines</span>
                  )}
                </div>
                <button
                  onClick={handleBulkAdd}
                  disabled={!canAddMore || submitting || bulkPreviewIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      {bulkProgress ? `${bulkProgress.added}/${bulkProgress.total}` : 'Adding...'}
                    </span>
                  ) : `Add ${bulkPreviewIds.length || ''} ID${bulkPreviewIds.length !== 1 ? 's' : ''}`}
                </button>
              </div>
              {bulkProgress && !submitting && bulkProgress.added > 0 && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                  ✓ Successfully added {bulkProgress.added} of {bulkProgress.total} identifier{bulkProgress.total !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {addError && <p className="text-xs text-red-600 mt-1">{addError}</p>}
          {!canAddMore && (
            <p className="text-xs text-amber-600 mt-1">All {book.total_copies} copy identifiers have been assigned.</p>
          )}
        </div>

        {/* Copies List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : copies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-slate-500 text-sm">No copy identifiers assigned yet.</p>
              <p className="text-slate-400 text-xs mt-1">Add unique identifiers above to track individual copies.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {copies.map((copy, idx) => (
                <div
                  key={copy.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    copy.is_available
                      ? 'bg-white border-slate-200 hover:border-indigo-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono w-6">{idx + 1}.</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 font-mono tracking-wide">{copy.copy_uid}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                          copy.is_available
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {copy.is_available ? '✓ Available' : '⏳ Borrowed'}
                        </span>
                        <span className="text-[10px] text-slate-400">{copy.condition}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(copy as any).assigned_to_name && (
                      <span className="text-xs text-slate-500 italic">→ {(copy as any).assigned_to_name}</span>
                    )}
                    {copy.is_available && (
                      <button
                        onClick={() => handleDeleteCopy(copy)}
                        disabled={deletingId === copy.id}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove copy identifier"
                      >
                        {deletingId === copy.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-400">
            {copies.length}/{book.total_copies} identifiers assigned
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Close
            </button>
            {onBorrow && (
              <button
                onClick={() => onBorrow(book)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
              >
                Borrow This Book
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCopyManager;

/**
 * Book Catalog — List, search, filter, add/edit books + bulk upload
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBookCatalog, useBookBulkUpload } from '../hooks/useLibrary';
import BookForm from './BookForm';
import { RESOURCE_TYPES, BOOK_CONDITIONS } from '../constants/cbcConstants';
import { APIService } from '../../../services/baseUrl';
import TablePagination, { usePagination } from '../utils/TablePagination';
import type { Book, BookFormData, ResourceType } from '../types';

interface ClassRecord { id: string; class_name: string }
interface SubjectRecord { id: string; subject_name: string }

const BookCatalog: React.FC = () => {
  const { books, totalCount, loading, setFilters, fetchBooks, addBook, updateBook, deleteBook } = useBookCatalog();
  const { uploading, progress: uploadProgress, error: uploadError, result: uploadResult, uploadBooks, reset: resetUpload } = useBookBulkUpload();
  const [showForm, setShowForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Database-driven filter options
  const [dbClasses, setDbClasses] = useState<ClassRecord[]>([]);
  const [dbSubjects, setDbSubjects] = useState<SubjectRecord[]>([]);

  // Auto-apply filters when any dropdown changes (skip initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newFilters: Record<string, string> = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedArea) newFilters.learning_area = selectedArea;
    if (selectedGrade) newFilters.grade_level = selectedGrade;
    if (selectedType) newFilters.resource_type = selectedType;
    setFilters(newFilters);
    fetchBooks(newFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea, selectedGrade, selectedType]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.allSettled([
          APIService.get<{ results: ClassRecord[] }>('/api/classes/', { page_size: '200' }, 'staff'),
          APIService.get<{ results: SubjectRecord[] }>('/api/subjects/', { page_size: '200' }, 'staff'),
        ]);
        if (classesRes.status === 'fulfilled') {
          const seen = new Set<string>();
          const unique = (classesRes.value.results || []).filter(c => {
            if (seen.has(c.class_name)) return false;
            seen.add(c.class_name);
            return true;
          });
          setDbClasses(unique);
        }
        if (subjectsRes.status === 'fulfilled') {
          const seen = new Set<string>();
          const unique = (subjectsRes.value.results || []).filter(s => {
            if (seen.has(s.subject_name)) return false;
            seen.add(s.subject_name);
            return true;
          });
          setDbSubjects(unique);
        }
      } catch { /* filters fallback to empty */ }
    };
    fetchFilterOptions();
  }, []);

  const handleSearch = () => {
    const newFilters: Record<string, string> = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedArea) newFilters.learning_area = selectedArea;
    if (selectedGrade) newFilters.grade_level = selectedGrade;
    if (selectedType) newFilters.resource_type = selectedType;
    setFilters(newFilters);
    fetchBooks(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedArea('');
    setSelectedGrade('');
    setSelectedType('');
    setFilters({});
    fetchBooks({});
  };

  const handleAddBook = async (data: BookFormData) => {
    setSubmitting(true);
    try {
      await addBook(data);
      setShowForm(false);
      setMessage({ type: 'success', text: 'Book added successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add book' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBook = async (data: BookFormData) => {
    if (!editingBook) return;
    setSubmitting(true);
    try {
      await updateBook(editingBook.id, data);
      setEditingBook(null);
      setShowForm(false);
      setMessage({ type: 'success', text: 'Book updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update book' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (book: Book) => {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await deleteBook(book.id);
      setMessage({ type: 'success', text: 'Book deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete book' });
    }
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    const rt = RESOURCE_TYPES.find(r => r.value === type);
    return rt?.icon || '📄';
  };

  const getConditionBadge = (condition: string) => {
    const c = BOOK_CONDITIONS.find(bc => bc.value === condition);
    return c ? <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c.color}`}>{c.label}</span> : condition;
  };

  // Client-side search for instant filtering
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    const q = searchTerm.toLowerCase();
    return books.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.isbn?.toLowerCase().includes(q) ||
      b.learning_areas?.some(a => a.toLowerCase().includes(q)) ||
      b.grade_levels?.some(g => g.toLowerCase().includes(q))
    );
  }, [books, searchTerm]);

  const {
    currentPage: bookPage,
    itemsPerPage: bookPerPage,
    paginatedItems: paginatedBooks,
    setPage: setBookPage,
    setItemsPerPage: setBookPerPage,
  } = usePagination(filteredBooks, 25);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Book / Resource Catalog</h2>
          <p className="text-sm text-slate-500">{totalCount} resources in library</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Books
          </button>
          <button
            onClick={() => { setEditingBook(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Book
        </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
          <button className="ml-3 underline text-xs" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by title, author, ISBN..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Subjects</option>
            {dbSubjects.map(s => <option key={s.id} value={s.subject_name}>{s.subject_name}</option>)}
          </select>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Classes</option>
            {dbClasses.map(c => <option key={c.id} value={c.class_name}>{c.class_name}</option>)}
          </select>
          <div className="flex gap-2">
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Types</option>
              {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={handleSearch} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>
        {(selectedArea || selectedGrade || selectedType || searchTerm) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Active filters:</span>
            {searchTerm && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">"{searchTerm}"</span>}
            {selectedArea && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{selectedArea}</span>}
            {selectedGrade && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">{selectedGrade}</span>}
            {selectedType && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{selectedType}</span>}
            <button onClick={handleClearFilters} className="text-xs text-red-500 hover:text-red-700 ml-2">Clear all</button>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex justify-end gap-1">
        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
        </button>
      </div>

      {/* Book List / Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No books found.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-600 underline text-sm">Add the first book</button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title / Author</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Learning Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">KICD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Copies</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Condition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getResourceTypeIcon(book.resource_type)}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{book.title}</p>
                          <p className="text-xs text-slate-500">{book.author} • {book.isbn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{RESOURCE_TYPES.find(r => r.value === book.resource_type)?.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {book.learning_areas.map(a => (
                          <span key={a} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded">{a}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {book.grade_levels.map(g => (
                          <span key={g} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded">{g}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {book.is_kicd_approved ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">✓ KICD</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-slate-800">{book.available_copies}</span>
                      <span className="text-xs text-slate-400">/{book.total_copies}</span>
                    </td>
                    <td className="px-4 py-3">{getConditionBadge(book.condition)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditingBook(book); setShowForm(true); }}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >Edit</button>
                        <button
                          onClick={() => handleDeleteBook(book)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            totalItems={filteredBooks.length}
            currentPage={bookPage}
            itemsPerPage={bookPerPage}
            onPageChange={setBookPage}
            onItemsPerPageChange={setBookPerPage}
            itemLabel="books"
          />
        </div>
      ) : (
        /* Grid View */
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedBooks.map((book) => (
            <div key={book.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{getResourceTypeIcon(book.resource_type)}</span>
                {book.is_kicd_approved && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium">KICD ✓</span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{book.title}</h4>
              <p className="text-xs text-slate-500 mb-2">{book.author}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {book.learning_areas.map(a => (
                  <span key={a} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded">{a}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{book.available_copies}/{book.total_copies} available</span>
                {getConditionBadge(book.condition)}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button onClick={() => { setEditingBook(book); setShowForm(true); }} className="flex-1 text-center text-xs text-indigo-600 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors font-medium">Edit</button>
                <button onClick={() => handleDeleteBook(book)} className="flex-1 text-center text-xs text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <TablePagination
            totalItems={filteredBooks.length}
            currentPage={bookPage}
            itemsPerPage={bookPerPage}
            onPageChange={setBookPage}
            onItemsPerPageChange={setBookPerPage}
            itemLabel="books"
          />
        </div>
        </>
      )}

      {/* Book Form Modal */}
      {showForm && (
        <BookForm
          book={editingBook}
          onSubmit={editingBook ? handleEditBook : handleAddBook}
          onClose={() => { setShowForm(false); setEditingBook(null); }}
          isLoading={submitting}
        />
      )}

      {/* Book Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Upload Books (CSV / XLSX)</h3>
              <button onClick={() => { setShowUploadModal(false); resetUpload(); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600">
                <p className="font-medium text-slate-700 mb-2">Required columns: <span className="text-indigo-600">title, author</span></p>
                <p className="mb-1">Optional columns: isbn, publisher, publication_year, edition, resource_type, learning_areas, grade_levels, total_copies, shelf_location, condition, is_kicd_approved, kicd_approval_number, description, barcode, date_acquired, digital_url, subject_integration_tags</p>
                <p className="mt-2 text-slate-500">Multi-value fields (learning_areas, grade_levels, subject_integration_tags) should be separated by semicolons (;)</p>
              </div>

              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                    setSelectedFile(file);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                />
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {selectedFile ? (
                  <p className="text-sm text-indigo-700 font-medium">{selectedFile.name} <span className="text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span></p>
                ) : (
                  <p className="text-sm text-slate-500">Drop a CSV or XLSX file here, or click to browse</p>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{uploadError}</div>
              )}

              {uploadProgress && (
                <div className="p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">{uploadProgress}</div>
              )}

              {uploadResult && uploadResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-slate-500 mb-1">Row errors:</p>
                  {uploadResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">Row {err.row}: {err.error}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowUploadModal(false); resetUpload(); setSelectedFile(null); }}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-medium"
                >Cancel</button>
                <button
                  disabled={!selectedFile || uploading}
                  onClick={async () => {
                    if (!selectedFile) return;
                    try {
                      await uploadBooks(selectedFile);
                      fetchBooks({});
                    } catch { /* error handled by hook */ }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Books'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCatalog;

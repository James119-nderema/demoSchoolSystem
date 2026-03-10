/**
 * CBC Resources Tab — Project resource tracking, reading corner logs,
 * learning area browser, digital resources section
 * Subjects and classes fetched from database APIs
 * Click books → manage copy IDs → borrow (Individual / Class)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCBCResources, useBookCatalog } from '../hooks/useLibrary';
import { APIService } from '../../../services/baseUrl';
import BookCopyManager from '../catalog/BookCopyManager';
import ResourceBorrowingModal from '../borrowing/ResourceBorrowingModal';
import type { Book } from '../types';

interface SubjectRecord { id: string; subject_name: string }
interface ClassRecord { id: string; class_name: string }

const CBCResourcesTab: React.FC = () => {
  const { projectRequests, readingLogs, loading } = useCBCResources();
  const { books } = useBookCatalog();
  const [activeSection, setActiveSection] = useState<'learning-areas' | 'projects' | 'reading-corner' | 'digital'>('learning-areas');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  // Database-driven subjects and classes
  const [dbSubjects, setDbSubjects] = useState<SubjectRecord[]>([]);
  const [dbClasses, setDbClasses] = useState<ClassRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Book copy manager & borrowing modal state
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<Book | null>(null);
  const [selectedBookForBorrowing, setSelectedBookForBorrowing] = useState<Book | null>(null);
  const [borrowSubject, setBorrowSubject] = useState('');

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [subjectsRes, classesRes] = await Promise.allSettled([
        APIService.get<{ results: SubjectRecord[] }>('/api/subjects/', { page_size: '200' }, 'staff'),
        APIService.get<{ results: ClassRecord[] }>('/api/classes/', { page_size: '200' }, 'staff'),
      ]);
      if (subjectsRes.status === 'fulfilled') {
        const seen = new Set<string>();
        setDbSubjects((subjectsRes.value.results || []).filter(s => {
          if (seen.has(s.subject_name)) return false;
          seen.add(s.subject_name);
          return true;
        }));
      }
      if (classesRes.status === 'fulfilled') {
        const seen = new Set<string>();
        setDbClasses((classesRes.value.results || []).filter(c => {
          if (seen.has(c.class_name)) return false;
          seen.add(c.class_name);
          return true;
        }));
      }
    } catch { /* silent */ }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter books by learning area and grade
  const filteredBooks = books.filter(b => {
    const matchesArea = !selectedArea || b.learning_areas.includes(selectedArea);
    const matchesGrade = !selectedGrade || b.grade_levels.includes(selectedGrade);
    return matchesArea && matchesGrade;
  });

  const digitalBooks = books.filter(b => b.resource_type === 'digital_resource');

  // Handlers for copy management & borrowing
  const handleBookClick = (book: Book) => {
    setSelectedBookForCopies(book);
  };

  const handleBorrowFromCopyManager = (book: Book) => {
    setSelectedBookForCopies(null);
    setSelectedBookForBorrowing(book);
    setBorrowSubject(selectedArea || book.learning_areas[0] || 'General');
  };

  const handleBorrowSuccess = () => {
    setSelectedBookForBorrowing(null);
  };

  const sections = [
    { key: 'learning-areas' as const, label: 'Learning Area Browser', icon: '📖' },
    { key: 'projects' as const, label: 'Project Resources', icon: '📋' },
    { key: 'reading-corner' as const, label: 'Reading Corner Log', icon: '📚' },
    { key: 'digital' as const, label: 'Digital Resources', icon: '💻' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">CBC Resources</h2>
        <p className="text-sm text-slate-500">Resources aligned with Kenya's Competency-Based Curriculum</p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeSection === s.key
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Learning Area Browser */}
      {activeSection === 'learning-areas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">All Subjects</option>
                {dbSubjects.map(s => <option key={s.id} value={s.subject_name}>{s.subject_name}</option>)}
              </select>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">All Classes</option>
                {dbClasses.map(c => <option key={c.id} value={c.class_name}>{c.class_name}</option>)}
              </select>
            </div>
            {loadingData && <p className="text-xs text-slate-400 mt-2">Loading subjects and classes...</p>}
          </div>

          {/* Learning Area Cards */}
          {!selectedArea ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dbSubjects.map(subj => {
                const areaBooks = books.filter(b => b.learning_areas.includes(subj.subject_name));
                return (
                  <div key={subj.id}
                    onClick={() => setSelectedArea(subj.subject_name)}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{subj.subject_name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">{areaBooks.length} resources</span>
                      <span className="text-xs text-indigo-600 font-medium">Browse →</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min((areaBooks.length / Math.max(books.length, 1)) * 100 * 3, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setSelectedArea('')} className="text-indigo-600 hover:text-indigo-800 text-sm">← All Areas</button>
                <span className="text-sm text-slate-500">/ {selectedArea}</span>
              </div>
              {filteredBooks.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-500">No resources found for this learning area.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map(book => (
                    <div key={book.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleBookClick(book)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">{book.title}</h4>
                        {book.is_kicd_approved && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full flex-shrink-0 ml-2">KICD</span>}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{book.author} • {book.publisher}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {book.grade_levels.map(g => <span key={g} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded">{g}</span>)}
                      </div>
                      {book.subject_integration_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {book.subject_integration_tags.map(tag => <span key={tag} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded">{tag}</span>)}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500">{book.available_copies}/{book.total_copies} copies available</p>
                        <span className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Manage Copies →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Project Resources */}
      {activeSection === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Portfolio Project Resource Tracking</h3>
            <p className="text-xs text-slate-500 mb-4">CBC requires students to complete portfolio projects. Track which library resources are being used for projects.</p>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : projectRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No project resource requests yet.</p>
                <p className="text-xs mt-1">Students can request resources for their CBC portfolio projects.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectRequests.map(req => (
                  <div key={req.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{req.project_title}</p>
                        <p className="text-xs text-slate-500">{req.student.full_name} — {req.learning_area} ({req.grade_level})</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        req.status === 'completed' ? 'bg-green-100 text-green-700' :
                        req.status === 'allocated' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'returned' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{req.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Corner Log */}
      {activeSection === 'reading-corner' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">📚 Reading Corner Log</h3>
            <p className="text-xs text-slate-500 mb-4">CBC promotes a reading culture from early grades. Log reading corner visits and activities.</p>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : readingLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No reading corner entries yet.</p>
                <p className="text-xs mt-1">Start logging reading corner visits to build a reading culture.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Student</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Book</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Learning Area</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Pages</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readingLogs.map(log => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 text-sm text-slate-800">{log.student.full_name}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{new Date(log.date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{log.book_read?.title || '—'}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{log.learning_area || '—'}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{log.pages_read || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Digital Resources */}
      {activeSection === 'digital' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">💻 Digital Resources</h3>
            <p className="text-xs text-slate-500 mb-4">CBC promotes digital literacy. Browse digital resources available in the library.</p>
            {digitalBooks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No digital resources in the catalog yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {digitalBooks.map(book => (
                  <div key={book.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💻</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{book.author}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {book.learning_areas.map(a => <span key={a} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded">{a}</span>)}
                        </div>
                        {book.digital_url && (
                          <a href={book.digital_url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2 font-medium"
                          >
                            Open Resource →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Book Copy Manager Modal ───────────────────────────────────────── */}
      {selectedBookForCopies && (
        <BookCopyManager
          book={selectedBookForCopies}
          onClose={() => setSelectedBookForCopies(null)}
          onBorrow={handleBorrowFromCopyManager}
        />
      )}

      {/* ─── Borrowing Modal (Individual / Class) ──────────────────────────── */}
      {selectedBookForBorrowing && (
        <ResourceBorrowingModal
          book={selectedBookForBorrowing}
          subject={borrowSubject}
          onClose={() => setSelectedBookForBorrowing(null)}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </div>
  );
};

export default CBCResourcesTab;

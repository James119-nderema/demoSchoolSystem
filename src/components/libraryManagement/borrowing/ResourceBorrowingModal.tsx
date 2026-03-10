/**
 * ResourceBorrowingModal — Enhanced borrowing modal for CBC Resources page
 * Supports two modes:
 *   1. Individual — select student/staff, pick up to 2 books, optional copy UID search
 *   2. Class — select class, teacher, auto-assign available copies to students,
 *              then generate a PDF borrowing register
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { APIService } from '../../../services/baseUrl';
import { useBookCopies, useClassBorrowing } from '../hooks/useLibrary';
import { libraryService } from '../services/libraryService';
import { generateClassBorrowingPDF } from '../utils/pdfGenerator';
import { DEFAULT_LIBRARY_SETTINGS } from '../constants/cbcConstants';
import type {
  Book,
  BorrowingMode,
  IssueBorrowingData,
  ClassBorrowingAssignment,
  ClassBorrowingData,
} from '../types';

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

interface ClassRecord {
  id: string;
  class_name: string;
  class_teacher?: string;
  class_teacher_name?: string;
}

interface Props {
  book: Book;
  subject: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ResourceBorrowingModal: React.FC<Props> = ({ book, subject, onClose, onSuccess }) => {
  // ─── Shared state ────────────────────────────────────────────────────
  const [mode, setMode] = useState<BorrowingMode>('individual');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dueDate = new Date(Date.now() + DEFAULT_LIBRARY_SETTINGS.default_loan_days_student * 86400000).toISOString().split('T')[0];
  const [dueDateVal, setDueDateVal] = useState(dueDate);

  // Book copies from API
  const { copies, loading: copiesLoading } = useBookCopies(book.id);
  const availableCopies = copies.filter(c => c.is_available);

  // Copy UID search
  const [copySearch, setCopySearch] = useState('');
  const filteredCopies = copySearch
    ? availableCopies.filter(c => c.copy_uid.toLowerCase().includes(copySearch.toLowerCase()))
    : availableCopies;

  // ─── Individual Mode ─────────────────────────────────────────────────
  const [memberType, setMemberType] = useState<'student' | 'staff'>('student');
  const [memberSearch, setMemberSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
  const [staffResults, setStaffResults] = useState<StaffSearchResult[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; identifier: string; type: 'student' | 'staff' } | null>(null);
  const [selectedCopyUids, setSelectedCopyUids] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const INDIVIDUAL_BOOK_LIMIT = 2;

  // Member search
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
          '/api/students/', { search: query, page_size: '15' }, 'staff',
        );
        setStudentResults(data.results || []);
      } else {
        const data = await APIService.get<{ results: StaffSearchResult[] }>(
          '/api/teachers/', { search: query, page_size: '15' }, 'staff',
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

  useEffect(() => {
    setSelectedMember(null);
    setMemberSearch('');
    setStudentResults([]);
    setStaffResults([]);
  }, [memberType]);

  const toggleCopySelection = (uid: string) => {
    setSelectedCopyUids(prev => {
      if (prev.includes(uid)) return prev.filter(u => u !== uid);
      if (prev.length >= INDIVIDUAL_BOOK_LIMIT) return prev; // limit
      return [...prev, uid];
    });
  };

  const handleIndividualIssue = async () => {
    if (!selectedMember) {
      setMessage({ type: 'error', text: 'Please select a borrower' });
      return;
    }
    if (selectedCopyUids.length === 0 && availableCopies.length > 0) {
      setMessage({ type: 'error', text: 'Please select at least one book copy' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      // Issue each selected copy
      const uids = selectedCopyUids.length > 0 ? selectedCopyUids : [''];
      for (const uid of uids) {
        const data: IssueBorrowingData = {
          book_id: book.id,
          member_id: selectedMember.id,
          member_type: selectedMember.type,
          due_date: dueDateVal,
          copy_uid: uid || undefined,
          borrowing_mode: 'individual',
        };
        await libraryService.issueBook(data);
      }
      setMessage({ type: 'success', text: `Successfully issued ${uids.length} book(s)!` });
      setTimeout(() => { onSuccess?.(); onClose(); }, 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to issue book' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Class Mode ──────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [classStudents, setClassStudents] = useState<StudentSearchResult[]>([]);
  const [teachers, setTeachers] = useState<StaffSearchResult[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<StaffSearchResult | null>(null);
  const [classAssignments, setClassAssignments] = useState<ClassBorrowingAssignment[]>([]);
  const [loadingClass, setLoadingClass] = useState(false);
  const [_pdfGenerated, setPdfGenerated] = useState(false);
  const { loading: classIssueLoading, issueClassBooks } = useClassBorrowing();

  // Fetch classes & teachers on mount
  useEffect(() => {
    if (mode !== 'class') return;
    const fetchClassesAndTeachers = async () => {
      try {
        const [classesRes, teachersRes] = await Promise.allSettled([
          APIService.get<{ results: ClassRecord[] }>('/api/classes/', { page_size: '200' }, 'staff'),
          APIService.get<{ results: StaffSearchResult[] }>('/api/teachers/', { page_size: '200' }, 'staff'),
        ]);
        if (classesRes.status === 'fulfilled') setClasses(classesRes.value.results || []);
        if (teachersRes.status === 'fulfilled') setTeachers(teachersRes.value.results || []);
      } catch { /* silent */ }
    };
    fetchClassesAndTeachers();
  }, [mode]);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) { setClassStudents([]); return; }
    const fetchStudents = async () => {
      setLoadingClass(true);
      try {
        // Fetch all students of this class — iterate pages if needed
        let allStudents: StudentSearchResult[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const data = await APIService.get<{ results: StudentSearchResult[]; next: string | null }>(
            '/api/students/', { class: selectedClass.class_name, page_size: '1000', page: String(page), view_all: 'true' }, 'staff',
          );
          allStudents = [...allStudents, ...(data.results || [])];
          hasMore = !!data.next;
          page++;
        }
        setClassStudents(allStudents);
      } catch { setClassStudents([]); }
      finally { setLoadingClass(false); }
    };
    fetchStudents();
  }, [selectedClass]);

  // Auto-assign available copies to students
  const autoAssignCopies = useCallback(() => {
    if (classStudents.length === 0) {
      setClassAssignments([]);
      return;
    }
    const assignments: ClassBorrowingAssignment[] = [];
    const avail = [...availableCopies];

    for (const student of classStudents) {
      if (avail.length === 0) break;
      const copy = avail.shift()!;
      assignments.push({
        student_id: student.id,
        student_name: student.full_name,
        admission_number: student.admission_number,
        copy_uid: copy.copy_uid,
      });
    }
    setClassAssignments(assignments);
  }, [classStudents, availableCopies]);

  useEffect(() => {
    if (mode === 'class' && classStudents.length > 0) {
      autoAssignCopies();
    }
  }, [mode, classStudents, autoAssignCopies]);

  // Edit a specific assignment's copy UID
  const updateAssignmentCopy = (idx: number, newUid: string) => {
    setClassAssignments(prev => prev.map((a, i) => i === idx ? { ...a, copy_uid: newUid } : a));
  };

  // Remove a student from assignments
  const removeAssignment = (idx: number) => {
    setClassAssignments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClassIssue = async () => {
    if (!selectedClass || !selectedTeacher || classAssignments.length === 0) {
      setMessage({ type: 'error', text: 'Please select a class, teacher, and ensure assignments exist' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const data: ClassBorrowingData = {
        book_id: book.id,
        class_id: selectedClass.id,
        class_name: selectedClass.class_name,
        teacher_id: selectedTeacher.id,
        teacher_name: selectedTeacher.full_name,
        subject,
        due_date: dueDateVal,
        assignments: classAssignments,
      };

      const result = await issueClassBooks(data);
      const issuedCount = result?.issued_count ?? classAssignments.length;
      const errorCount = result?.error_count ?? 0;

      if (errorCount > 0 && issuedCount > 0) {
        setMessage({ type: 'success', text: `Issued ${issuedCount} book(s) to ${selectedClass.class_name} (${errorCount} failed)` });
      } else if (issuedCount > 0) {
        setMessage({ type: 'success', text: `Successfully issued ${issuedCount} book(s) to ${selectedClass.class_name}!` });
      } else {
        setMessage({ type: 'error', text: 'No books could be issued. Check copy availability.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to issue class books' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!selectedClass || !selectedTeacher || classAssignments.length === 0) {
      setMessage({ type: 'error', text: 'No assignments to generate PDF for' });
      return;
    }
    generateClassBorrowingPDF({
      subject,
      bookTitle: book.title,
      bookAuthor: book.author,
      className: selectedClass.class_name,
      teacherName: selectedTeacher.full_name,
      dueDate: dueDateVal,
      issueDate: new Date().toLocaleDateString('en-GB'),
      assignments: classAssignments,
    });
    setPdfGenerated(true);
    setMessage({ type: 'success', text: 'PDF generated and downloaded!' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Borrow Book</h3>
            <p className="text-sm text-slate-500">{book.title} — {subject}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setMode('individual')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'individual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              👤 Individual
            </button>
            <button
              onClick={() => setMode('class')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'class' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🏫 Class
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-2 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
            <button className="ml-3 underline text-xs" onClick={() => setMessage(null)}>Dismiss</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Due Date (shared) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDateVal}
              onChange={(e) => setDueDateVal(e.target.value)}
              className="w-full sm:w-60 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* ─── INDIVIDUAL MODE ───────────────────────────────────────── */}
          {mode === 'individual' && (
            <>
              {/* Member selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Issue To *</label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-3">
                  <button type="button" onClick={() => setMemberType('student')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${memberType === 'student' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                  >Student</button>
                  <button type="button" onClick={() => setMemberType('staff')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${memberType === 'staff' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                  >Teacher / Staff</button>
                </div>

                {selectedMember ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-indigo-800">{selectedMember.name}</p>
                      <p className="text-xs text-indigo-600">{selectedMember.identifier}</p>
                    </div>
                    <button onClick={() => setSelectedMember(null)} className="text-indigo-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                      <div className="absolute right-3 top-2.5"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div></div>
                    )}
                    {memberType === 'student' && studentResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {studentResults.map(s => (
                          <button key={s.id} type="button"
                            onClick={() => { setSelectedMember({ id: s.id, name: s.full_name, identifier: `Adm: ${s.admission_number} • ${s.current_class}`, type: 'student' }); setMemberSearch(''); setStudentResults([]); }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                            <p className="text-xs text-slate-500">Adm: {s.admission_number} • {s.current_class}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {memberType === 'staff' && staffResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {staffResults.map(s => (
                          <button key={s.id} type="button"
                            onClick={() => { setSelectedMember({ id: s.id, name: s.full_name, identifier: `Staff#: ${s.staff_number} • ${s.role}`, type: 'staff' }); setMemberSearch(''); setStaffResults([]); }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                            <p className="text-xs text-slate-500">Staff#: {s.staff_number} • {s.role}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Copy selection (max 2) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Book Copy IDs (max {INDIVIDUAL_BOOK_LIMIT})
                </label>
                <input
                  type="text"
                  value={copySearch}
                  onChange={(e) => setCopySearch(e.target.value)}
                  placeholder="Search copy ID..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2"
                />

                {selectedCopyUids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCopyUids.map(uid => (
                      <span key={uid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        {uid}
                        <button onClick={() => toggleCopySelection(uid)} className="text-indigo-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}

                {copiesLoading ? (
                  <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                ) : filteredCopies.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">{availableCopies.length === 0 ? 'No copy identifiers available. Assign copies first.' : 'No copies match your search.'}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {filteredCopies.map(c => {
                      const isSelected = selectedCopyUids.includes(c.copy_uid);
                      const isDisabled = !isSelected && selectedCopyUids.length >= INDIVIDUAL_BOOK_LIMIT;
                      return (
                        <button
                          key={c.id}
                          onClick={() => !isDisabled && toggleCopySelection(c.copy_uid)}
                          disabled={isDisabled}
                          className={`px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                              : isDisabled
                              ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 hover:border-indigo-200 text-slate-700'
                          }`}
                        >
                          <span className="font-mono text-xs">{c.copy_uid}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── CLASS MODE ────────────────────────────────────────────── */}
          {mode === 'class' && (
            <>
              {/* Class selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Class *</label>
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const cls = classes.find(c => c.id === e.target.value);
                      setSelectedClass(cls || null);
                      // Auto-select class teacher if available
                      if (cls?.class_teacher) {
                        const teacher = teachers.find(t => t.id === cls.class_teacher);
                        if (teacher) setSelectedTeacher(teacher);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">— Select Class —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teacher In-Charge *</label>
                  <select
                    value={selectedTeacher?.id || ''}
                    onChange={(e) => {
                      const t = teachers.find(tc => tc.id === e.target.value);
                      setSelectedTeacher(t || null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">— Select Teacher —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                  </select>
                </div>
              </div>

              {/* Info badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  📚 {availableCopies.length} copies available
                </span>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  👥 {classStudents.length} students in class
                </span>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                  ✅ {classAssignments.length} assigned
                </span>
                {classStudents.length > availableCopies.length && (
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full">
                    ⚠️ Not enough copies for all students
                  </span>
                )}
              </div>

              {/* Assignments table */}
              {loadingClass ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : classAssignments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  {selectedClass ? 'No students found or no copies available to assign.' : 'Select a class to begin.'}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Admission No.</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Student Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Copy ID</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classAssignments.map((a, idx) => (
                          <tr key={`${a.student_id}-${idx}`} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-xs text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 text-xs font-medium text-slate-700">{a.admission_number}</td>
                            <td className="px-3 py-2 text-sm text-slate-800">{a.student_name}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={a.copy_uid}
                                onChange={(e) => updateAssignmentCopy(idx, e.target.value)}
                                className="w-28 px-2 py-1 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => removeAssignment(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove from list"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex flex-wrap justify-between items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium">
            Cancel
          </button>

          <div className="flex gap-2">
            {mode === 'class' && classAssignments.length > 0 && (
              <button
                onClick={handleGeneratePDF}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
            )}

            <button
              onClick={mode === 'individual' ? handleIndividualIssue : handleClassIssue}
              disabled={submitting || classIssueLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {submitting || classIssueLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : mode === 'individual' ? (
                `Issue Book${selectedCopyUids.length > 1 ? 's' : ''}`
              ) : (
                `Issue to ${classAssignments.length} Student${classAssignments.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceBorrowingModal;

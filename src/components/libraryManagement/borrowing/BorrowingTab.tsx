/**
 * Borrowing Tab — Issue, return, renew, mark-lost books
 * Issue modal supports two modes:
 *   1. Individual — select student/staff, pick multiple books (different titles),
 *                   choose copy UIDs, one-per-title enforcement
 *   2. Class — select class, teacher, auto-assign copies to students,
 *              editable assignments table, PDF generation
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useBorrowing, useClassBorrowing } from '../hooks/useLibrary';
import { BORROWING_STATUS_LABELS, BOOK_CONDITIONS, DEFAULT_LIBRARY_SETTINGS } from '../constants/cbcConstants';
import { APIService } from '../../../services/baseUrl';
import { libraryService } from '../services/libraryService';
import { generateClassBorrowingPDF, generateBorrowingReportPDF, parseBorrowingNotes } from '../utils/pdfGenerator';
import TablePagination, { usePagination } from '../utils/TablePagination';
import type {
  BorrowingRecord,
  BorrowingMode,
  IssueBorrowingData,
  BookCondition,
  BookCopy as BookCopyType,
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

interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
  price?: number;
}

interface ClassRecord {
  id: string;
  class_name: string;
  class_teacher?: string;
  class_teacher_name?: string;
}

/** Tracks a book + selected copy UIDs in individual multi-book mode */
interface SelectedBookEntry {
  book: BookSearchResult;
  copyUids: string[];
  availableCopies: BookCopyType[];
  loadingCopies: boolean;
}

const BorrowingTab: React.FC = () => {
  const { borrowings, loading, issueBook, returnBook, renewBook, markLost, returnClassBooks } = useBorrowing();

  const [activeView, setActiveView] = useState<'active' | 'overdue' | 'all'>('active');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showBulkReturnModal, setShowBulkReturnModal] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingRecord | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyUidSearch, setCopyUidSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Return form state
  const [returnCondition, setReturnCondition] = useState<BookCondition>('good');
  const [returnNotes, setReturnNotes] = useState('');

  // Bulk return state
  const [bulkReturnClass, setBulkReturnClass] = useState('');
  const [bulkReturnCondition, setBulkReturnCondition] = useState<BookCondition>('good');
  const [bulkReturnNotes, setBulkReturnNotes] = useState('');
  const [bulkReturnSelected, setBulkReturnSelected] = useState<Set<string>>(new Set());
  const [bulkReturnMode, setBulkReturnMode] = useState<'class' | 'individual'>('class');

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ─── Issue Modal State ────────────────────────────────────────────────
  const [issueMode, setIssueMode] = useState<BorrowingMode>('individual');
  const dueDate = new Date(Date.now() + DEFAULT_LIBRARY_SETTINGS.default_loan_days_student * 86400000).toISOString().split('T')[0];
  const [dueDateVal, setDueDateVal] = useState(dueDate);
  const [issueMessage, setIssueMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Individual Mode State ────────────────────────────────────────────
  const [memberType, setMemberType] = useState<'student' | 'staff'>('student');
  const [memberSearch, setMemberSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
  const [staffResults, setStaffResults] = useState<StaffSearchResult[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; identifier: string; type: 'student' | 'staff' } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-book selection
  const [selectedBooks, setSelectedBooks] = useState<SelectedBookEntry[]>([]);
  const [bookSearch, setBookSearch] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const bookSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Class Mode State ─────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [classStudents, setClassStudents] = useState<StudentSearchResult[]>([]);
  const [teachers, setTeachers] = useState<StaffSearchResult[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<StaffSearchResult | null>(null);
  const [classAssignments, setClassAssignments] = useState<ClassBorrowingAssignment[]>([]);
  const [loadingClass, setLoadingClass] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const { loading: classIssueLoading, issueClassBooks } = useClassBorrowing();

  // Class mode — selected book for class issuing
  const [classBook, setClassBook] = useState<BookSearchResult | null>(null);
  const [classBookSearch, setClassBookSearch] = useState('');
  const [classBookResults, setClassBookResults] = useState<BookSearchResult[]>([]);
  const [searchingClassBooks, setSearchingClassBooks] = useState(false);
  const classBookSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [classBookCopies, setClassBookCopies] = useState<BookCopyType[]>([]);
  const [loadingClassCopies, setLoadingClassCopies] = useState(false);

  // ─── Member Search (shared) ───────────────────────────────────────────
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

  // ─── Book Search (Individual) ─────────────────────────────────────────
  const searchBooks = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      if (!query) {
        try {
          setSearchingBooks(true);
          const data = await APIService.get<{ results: BookSearchResult[] }>(
            '/api/library/books/', { page_size: '50', available: 'true' }, 'staff',
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
        '/api/library/books/', { search: query, page_size: '50' }, 'staff',
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

  // Load initial books when issue modal opens
  useEffect(() => {
    if (showIssueModal && issueMode === 'individual' && bookResults.length === 0 && selectedBooks.length === 0) {
      searchBooks('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIssueModal, issueMode]);

  // ─── Add Book to Individual Selection ─────────────────────────────────
  const addBookToSelection = async (book: BookSearchResult) => {
    // Duplicate title check — can't add same title twice
    if (selectedBooks.some(sb => sb.book.id === book.id)) {
      setIssueMessage({ type: 'error', text: `"${book.title}" is already selected. Pick a different title.` });
      return;
    }
    // Also check if member already actively borrows this title
    if (selectedMember) {
      try {
        const memberBorrowings = await libraryService.getMemberBorrowings(selectedMember.id, { status: 'active' });
        const activeBorrowings = memberBorrowings.results || [];
        const alreadyBorrowed = activeBorrowings.some(
          (b: BorrowingRecord) => b.book.id === book.id || b.book.title === book.title,
        );
        if (alreadyBorrowed) {
          setIssueMessage({ type: 'error', text: `Member already has an active borrowing for "${book.title}". Choose a different title.` });
          return;
        }
      } catch {
        // Continue anyway, backend will also validate
      }
    }

    const entry: SelectedBookEntry = {
      book,
      copyUids: [],
      availableCopies: [],
      loadingCopies: true,
    };
    setSelectedBooks(prev => [...prev, entry]);
    setBookSearch('');
    setBookResults([]);

    // Fetch copies for this book
    try {
      const copiesData = await APIService.get<{ results: BookCopyType[] }>(
        `/api/library/books/${book.id}/copies/`, {}, 'staff',
      );
      const avail = (copiesData.results || []).filter(c => c.is_available);
      setSelectedBooks(prev =>
        prev.map(sb => sb.book.id === book.id ? { ...sb, availableCopies: avail, loadingCopies: false } : sb),
      );
    } catch {
      setSelectedBooks(prev =>
        prev.map(sb => sb.book.id === book.id ? { ...sb, loadingCopies: false } : sb),
      );
    }
  };

  const removeBookFromSelection = (bookId: string) => {
    setSelectedBooks(prev => prev.filter(sb => sb.book.id !== bookId));
  };

  const toggleCopyForBook = (bookId: string, uid: string) => {
    setSelectedBooks(prev =>
      prev.map(sb => {
        if (sb.book.id !== bookId) return sb;
        const already = sb.copyUids.includes(uid);
        return {
          ...sb,
          copyUids: already
            ? sb.copyUids.filter(u => u !== uid)
            : [uid],  // Only 1 copy per book in individual mode
        };
      }),
    );
  };

  // ─── Issue Individual ─────────────────────────────────────────────────
  const handleIndividualIssue = async () => {
    if (!selectedMember) {
      setIssueMessage({ type: 'error', text: 'Please select a borrower' });
      return;
    }
    if (selectedBooks.length === 0) {
      setIssueMessage({ type: 'error', text: 'Please select at least one book' });
      return;
    }
    setSubmitting(true);
    setIssueMessage(null);
    let successCount = 0;
    const errorMessages: string[] = [];

    for (const entry of selectedBooks) {
      try {
        const uid = entry.copyUids[0] || '';
        const data: IssueBorrowingData = {
          book_id: entry.book.id,
          member_id: selectedMember.id,
          member_type: selectedMember.type,
          due_date: dueDateVal,
          copy_uid: uid || undefined,
          borrowing_mode: 'individual',
        };
        await issueBook(data);
        successCount++;
      } catch (err: any) {
        errorMessages.push(`${entry.book.title}: ${err.message || 'Failed'}`);
      }
    }

    if (successCount > 0) {
      setIssueMessage({
        type: errorMessages.length > 0 ? 'error' : 'success',
        text: `Issued ${successCount} book(s)${errorMessages.length > 0 ? `. Errors: ${errorMessages.join('; ')}` : '!'}`,
      });
      if (errorMessages.length === 0) {
        setTimeout(() => { setShowIssueModal(false); resetIssueForm(); }, 1200);
      }
    } else {
      setIssueMessage({ type: 'error', text: errorMessages.join('; ') || 'Failed to issue books' });
    }
    setSubmitting(false);
  };

  // ─── Class Mode — Book Search ─────────────────────────────────────────
  const searchClassBooks = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      if (!query) {
        try {
          setSearchingClassBooks(true);
          const data = await APIService.get<{ results: BookSearchResult[] }>(
            '/api/library/books/', { page_size: '50', available: 'true' }, 'staff',
          );
          setClassBookResults((data.results || []).filter(b => b.available_copies > 0));
        } catch { setClassBookResults([]); }
        finally { setSearchingClassBooks(false); }
      } else {
        setClassBookResults([]);
      }
      return;
    }
    setSearchingClassBooks(true);
    try {
      const data = await APIService.get<{ results: BookSearchResult[] }>(
        '/api/library/books/', { search: query, page_size: '50' }, 'staff',
      );
      setClassBookResults((data.results || []).filter(b => b.available_copies > 0));
    } catch {
      setClassBookResults([]);
    } finally {
      setSearchingClassBooks(false);
    }
  }, []);

  useEffect(() => {
    if (classBookSearchTimeoutRef.current) clearTimeout(classBookSearchTimeoutRef.current);
    classBookSearchTimeoutRef.current = setTimeout(() => searchClassBooks(classBookSearch), 300);
    return () => { if (classBookSearchTimeoutRef.current) clearTimeout(classBookSearchTimeoutRef.current); };
  }, [classBookSearch, searchClassBooks]);

  // When class book is selected, fetch copies
  useEffect(() => {
    if (!classBook) { setClassBookCopies([]); return; }
    const fetchCopies = async () => {
      setLoadingClassCopies(true);
      try {
        const data = await APIService.get<{ results: BookCopyType[] }>(
          `/api/library/books/${classBook.id}/copies/`, {}, 'staff',
        );
        setClassBookCopies((data.results || []).filter(c => c.is_available));
      } catch { setClassBookCopies([]); }
      finally { setLoadingClassCopies(false); }
    };
    fetchCopies();
  }, [classBook]);

  // Fetch classes & teachers on class mode
  useEffect(() => {
    if (issueMode !== 'class' || !showIssueModal) return;
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
    if (!classBook) searchClassBooks('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueMode, showIssueModal]);

  // Fetch students when class selected
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

  // Auto-assign copies to students
  const autoAssignCopies = useCallback(() => {
    if (classStudents.length === 0 || classBookCopies.length === 0) {
      setClassAssignments([]);
      return;
    }
    const assignments: ClassBorrowingAssignment[] = [];
    const avail = [...classBookCopies];
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
  }, [classStudents, classBookCopies]);

  useEffect(() => {
    if (issueMode === 'class' && classStudents.length > 0 && classBook) {
      autoAssignCopies();
    }
  }, [issueMode, classStudents, autoAssignCopies, classBook]);

  const updateAssignmentCopy = (idx: number, newUid: string) => {
    setClassAssignments(prev => prev.map((a, i) => i === idx ? { ...a, copy_uid: newUid } : a));
  };

  const removeAssignment = (idx: number) => {
    setClassAssignments(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Issue Class ──────────────────────────────────────────────────────
  const handleClassIssue = async () => {
    if (!selectedClass || !selectedTeacher || !classBook || classAssignments.length === 0) {
      setIssueMessage({ type: 'error', text: 'Please select a book, class, teacher, and ensure assignments exist' });
      return;
    }
    setSubmitting(true);
    setIssueMessage(null);
    try {
      const data: ClassBorrowingData = {
        book_id: classBook.id,
        class_id: selectedClass.id,
        class_name: selectedClass.class_name,
        teacher_id: selectedTeacher.id,
        teacher_name: selectedTeacher.full_name,
        subject: '',
        due_date: dueDateVal,
        assignments: classAssignments,
      };

      const result = await issueClassBooks(data);
      const issuedCount = result?.issued_count ?? classAssignments.length;
      const errorCount = result?.error_count ?? 0;

      if (errorCount > 0 && issuedCount > 0) {
        setIssueMessage({ type: 'success', text: `Issued ${issuedCount} book(s) to ${selectedClass.class_name} (${errorCount} failed)` });
      } else if (issuedCount > 0) {
        setIssueMessage({ type: 'success', text: `Successfully issued ${issuedCount} book(s) to ${selectedClass.class_name}!` });
      } else {
        setIssueMessage({ type: 'error', text: 'No books could be issued. Check copy availability.' });
      }
    } catch (err: any) {
      setIssueMessage({ type: 'error', text: err.message || 'Failed to issue class books' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!selectedClass || !selectedTeacher || !classBook || classAssignments.length === 0) {
      setIssueMessage({ type: 'error', text: 'No assignments to generate PDF for' });
      return;
    }
    generateClassBorrowingPDF({
      subject: '',
      bookTitle: classBook.title,
      bookAuthor: classBook.author,
      className: selectedClass.class_name,
      teacherName: selectedTeacher.full_name,
      dueDate: dueDateVal,
      issueDate: new Date().toLocaleDateString('en-GB'),
      assignments: classAssignments,
    });
    setPdfGenerated(true);
    setIssueMessage({ type: 'success', text: 'PDF generated and downloaded!' });
  };

  // ─── Reset Issue Form ─────────────────────────────────────────────────
  const resetIssueForm = () => {
    setSelectedMember(null);
    setSelectedBooks([]);
    setBookSearch('');
    setBookResults([]);
    setIssueMessage(null);
    setMemberSearch('');
    setDueDateVal(dueDate);
    setIssueMode('individual');
    setSelectedClass(null);
    setSelectedTeacher(null);
    setClassStudents([]);
    setClassAssignments([]);
    setClassBook(null);
    setClassBookSearch('');
    setClassBookResults([]);
    setPdfGenerated(false);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────
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

  const handleMarkLost = async (record: BorrowingRecord) => {
    const priceNote = record.book.price && Number(record.book.price) > 0
      ? `KES ${record.book.price} will be charged to the student's fee invoice.`
      : '';
    if (!confirm(`Mark "${record.book.title}" as LOST? ${priceNote}`)) return;
    try {
      const result = await markLost(record.id);
      if (result.invoice_created) {
        setMessage({ type: 'success', text: `Book marked as lost. KES ${result.charge_amount} added to student's fee invoice.` });
      } else {
        setMessage({ type: 'success', text: 'Book marked as lost.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to mark book as lost' });
    }
  };

  // ─── Extract unique classes from borrowings ────────────────────────────
  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    borrowings.forEach(b => {
      const grade = b.member.grade;
      if (grade) classSet.add(grade);
      // Also extract class from notes for class-issued books
      const parsed = parseBorrowingNotes(b.notes || '');
      if (parsed.isClass && parsed.className) classSet.add(parsed.className);
    });
    return Array.from(classSet).sort();
  }, [borrowings]);

  // ─── Filtered Borrowings ──────────────────────────────────────────────
  const filteredBorrowings = (activeView === 'active'
    ? borrowings.filter(b => b.status === 'active' || b.status === 'renewed')
    : activeView === 'overdue'
    ? borrowings.filter(b => b.status === 'overdue')
    : borrowings
  ).filter(b => {
    // Class filter
    if (classFilter) {
      const grade = b.member.grade || '';
      const parsed = parseBorrowingNotes(b.notes || '');
      const matchesGrade = grade.toLowerCase() === classFilter.toLowerCase();
      const matchesNotes = parsed.isClass && parsed.className.toLowerCase() === classFilter.toLowerCase();
      if (!matchesGrade && !matchesNotes) return false;
    }
    if (!copyUidSearch) return true;
    const q = copyUidSearch.toLowerCase();
    return (
      (b as any).copy_uid?.toLowerCase().includes(q) ||
      b.book.title.toLowerCase().includes(q) ||
      b.member.full_name.toLowerCase().includes(q) ||
      b.member.admission_number?.toLowerCase().includes(q) ||
      b.book.isbn?.toLowerCase().includes(q)
    );
  });

  // ─── Pagination ───────────────────────────────────────────────────────
  const {
    currentPage: borrowingPage,
    itemsPerPage: borrowingPerPage,
    paginatedItems: paginatedBorrowings,
    setPage: setBorrowingPage,
    setItemsPerPage: setBorrowingPerPage,
  } = usePagination(filteredBorrowings, 25);

  // ─── Download Borrowing Report ────────────────────────────────────────
  const handleDownloadReport = () => {
    const rows = filteredBorrowings.map(b => {
      const parsed = parseBorrowingNotes(b.notes || '');
      const statusInfo = BORROWING_STATUS_LABELS[b.status];
      return {
        bookTitle: b.book.title,
        bookISBN: b.book.isbn || '',
        copyUid: (b as any).copy_uid || '',
        memberName: b.member.full_name,
        admissionNumber: b.member.admission_number || b.member.staff_id || '',
        memberGrade: b.member.grade || (parsed.isClass ? parsed.className : ''),
        issueDate: formatDate(b.issue_date),
        dueDate: formatDate(b.due_date),
        status: statusInfo?.label || b.status,
        teacherName: parsed.isClass ? parsed.teacher : '',
        isClassBorrowing: parsed.isClass,
      };
    });
    generateBorrowingReportPDF({
      rows,
      filterClass: classFilter || undefined,
      filterStatus: activeView !== 'all' ? activeView : undefined,
    });
    setMessage({ type: 'success', text: 'PDF report downloaded!' });
  };

  // ─── Bulk Return Handler ──────────────────────────────────────────────
  const activeBorrowingsForBulkReturn = useMemo(() => {
    return borrowings.filter(b => {
      if (b.status !== 'active' && b.status !== 'renewed' && b.status !== 'overdue') return false;
      if (bulkReturnMode === 'class' && bulkReturnClass) {
        const grade = b.member.grade || '';
        const parsed = parseBorrowingNotes(b.notes || '');
        return grade.toLowerCase() === bulkReturnClass.toLowerCase() ||
          (parsed.isClass && parsed.className.toLowerCase() === bulkReturnClass.toLowerCase());
      }
      return true;
    });
  }, [borrowings, bulkReturnClass, bulkReturnMode]);

  const handleBulkReturn = async () => {
    const ids = Array.from(bulkReturnSelected);
    if (ids.length === 0) {
      setMessage({ type: 'error', text: 'No books selected for return' });
      return;
    }
    if (!confirm(`Return ${ids.length} book(s)?`)) return;
    setSubmitting(true);
    try {
      const result = await returnClassBooks(ids, bulkReturnCondition, bulkReturnNotes);
      setMessage({
        type: 'success',
        text: `Returned ${result.returned_count} book(s)${result.error_count > 0 ? ` (${result.error_count} failed)` : '!'}`,
      });
      setShowBulkReturnModal(false);
      setBulkReturnSelected(new Set());
      setBulkReturnClass('');
      setBulkReturnNotes('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Bulk return failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBulkReturnSelect = (id: string) => {
    setBulkReturnSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleBulkReturnAll = () => {
    if (bulkReturnSelected.size === activeBorrowingsForBulkReturn.length) {
      setBulkReturnSelected(new Set());
    } else {
      setBulkReturnSelected(new Set(activeBorrowingsForBulkReturn.map(b => b.id)));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Borrowing & Returns</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadReport}
            disabled={filteredBorrowings.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download
          </button>
          <button
            onClick={() => setShowBulkReturnModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Bulk Return
          </button>
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
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
        {/* Class Filter */}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
        >
          <option value="">All Classes</option>
          {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={copyUidSearch}
            onChange={(e) => setCopyUidSearch(e.target.value)}
            placeholder="Search by Copy ID, title, name, adm no..."
            className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {copyUidSearch && (
            <button onClick={() => setCopyUidSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Copy ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Issued</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fine</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBorrowings.map(record => {
                  const statusInfo = BORROWING_STATUS_LABELS[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{record.book.title}</p>
                        <p className="text-xs text-slate-500">{record.book.isbn}</p>
                      </td>
                      <td className="px-4 py-3">
                        {(record as any).copy_uid ? (
                          <span className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono rounded">{(record as any).copy_uid}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
                              <button
                                onClick={() => handleMarkLost(record)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >Lost</button>
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
          <TablePagination
            totalItems={filteredBorrowings.length}
            currentPage={borrowingPage}
            itemsPerPage={borrowingPerPage}
            onPageChange={setBorrowingPage}
            onItemsPerPageChange={setBorrowingPerPage}
            itemLabel="records"
          />
        </div>
      )}

      {/* ═══════════════════ ISSUE MODAL ═══════════════════ */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Issue Book</h3>
              <button onClick={() => { setShowIssueModal(false); resetIssueForm(); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setIssueMode('individual')}
                  className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                    issueMode === 'individual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  👤 Individual
                </button>
                <button
                  onClick={() => setIssueMode('class')}
                  className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                    issueMode === 'class' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏫 Class
                </button>
              </div>
            </div>

            {/* Message */}
            {issueMessage && (
              <div className={`mx-6 mt-2 p-3 rounded-lg text-sm ${
                issueMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {issueMessage.text}
                <button className="ml-3 underline text-xs" onClick={() => setIssueMessage(null)}>Dismiss</button>
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

              {/* ─── INDIVIDUAL MODE ──────────────────────────────────────── */}
              {issueMode === 'individual' && (
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

                  {/* Multi-book selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Add Books (different titles) *</label>
                    <p className="text-xs text-slate-400 mb-2">One copy per book title. Select various books from different subjects.</p>
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
                          {bookResults.map(b => {
                            const alreadySelected = selectedBooks.some(sb => sb.book.id === b.id);
                            return (
                              <button
                                key={b.id} type="button"
                                onClick={() => !alreadySelected && addBookToSelection(b)}
                                disabled={alreadySelected}
                                className={`w-full text-left px-3 py-2 transition-colors border-b border-slate-100 last:border-0 ${
                                  alreadySelected ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-indigo-50'
                                }`}
                              >
                                <p className="text-sm font-medium text-slate-800">{b.title}{alreadySelected ? ' ✓' : ''}</p>
                                <p className="text-xs text-slate-500">{b.author} • {b.available_copies} available{b.price ? ` • KES ${b.price}` : ''}</p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected books with copy UID pickers */}
                  {selectedBooks.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-700">{selectedBooks.length} book(s) selected</p>
                      {selectedBooks.map(entry => (
                        <div key={entry.book.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{entry.book.title}</p>
                              <p className="text-xs text-slate-500">{entry.book.author}{entry.book.price ? ` • KES ${entry.book.price}` : ''}</p>
                            </div>
                            <button onClick={() => removeBookFromSelection(entry.book.id)} className="text-slate-400 hover:text-red-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {/* Copy UID selection */}
                          {entry.loadingCopies ? (
                            <div className="flex items-center gap-2 py-1"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div><span className="text-xs text-slate-400">Loading copies...</span></div>
                          ) : entry.availableCopies.length === 0 ? (
                            <p className="text-xs text-amber-600">No copy IDs assigned. Book will be issued without a copy ID.</p>
                          ) : (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Select copy ID:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.availableCopies.map(c => {
                                  const isSelected = entry.copyUids.includes(c.copy_uid);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => toggleCopyForBook(entry.book.id, c.copy_uid)}
                                      className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
                                        isSelected
                                          ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                          : 'bg-white border-slate-200 hover:border-indigo-200 text-slate-700'
                                      }`}
                                    >
                                      {c.copy_uid}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ─── CLASS MODE ───────────────────────────────────────────── */}
              {issueMode === 'class' && (
                <>
                  {/* Book selection for class */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Book *</label>
                    {classBook ? (
                      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-indigo-800">{classBook.title}</p>
                          <p className="text-xs text-indigo-600">{classBook.author} • {classBook.available_copies} available</p>
                        </div>
                        <button type="button" onClick={() => { setClassBook(null); setClassBookCopies([]); setClassAssignments([]); searchClassBooks(''); }} className="text-indigo-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={classBookSearch}
                          onChange={(e) => setClassBookSearch(e.target.value)}
                          placeholder="Search by title, ISBN, or author..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        {searchingClassBooks && (
                          <div className="absolute right-3 top-2.5"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div></div>
                        )}
                        {classBookResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {classBookResults.map(b => (
                              <button key={b.id} type="button" onClick={() => { setClassBook(b); setClassBookSearch(''); setClassBookResults([]); }}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                              >
                                <p className="text-sm font-medium text-slate-800">{b.title}</p>
                                <p className="text-xs text-slate-500">{b.author} • {b.available_copies} available</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Class & Teacher selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Class *</label>
                      <select
                        value={selectedClass?.id || ''}
                        onChange={(e) => {
                          const cls = classes.find(c => c.id === e.target.value);
                          setSelectedClass(cls || null);
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
                  {classBook && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                        📚 {classBookCopies.length} copies available
                      </span>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                        👥 {classStudents.length} students in class
                      </span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                        ✅ {classAssignments.length} assigned
                      </span>
                      {classStudents.length > classBookCopies.length && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full">
                          ⚠️ Not enough copies for all students
                        </span>
                      )}
                    </div>
                  )}

                  {/* Assignments table */}
                  {loadingClass || loadingClassCopies ? (
                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  ) : classAssignments.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      {!classBook ? 'Select a book to begin.' : selectedClass ? 'No students found or no copies available to assign.' : 'Select a class to begin.'}
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
                                  <button onClick={() => removeAssignment(idx)} className="text-slate-400 hover:text-red-500 transition-colors" title="Remove from list">
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
              <button onClick={() => { setShowIssueModal(false); resetIssueForm(); }} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium">
                Cancel
              </button>

              <div className="flex gap-2">
                {issueMode === 'class' && classAssignments.length > 0 && (
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
                  onClick={issueMode === 'individual' ? handleIndividualIssue : handleClassIssue}
                  disabled={submitting || classIssueLoading}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting || classIssueLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : issueMode === 'individual' ? (
                    `Issue ${selectedBooks.length} Book${selectedBooks.length !== 1 ? 's' : ''}`
                  ) : (
                    `Issue to ${classAssignments.length} Student${classAssignments.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
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

      {/* ═══════════════════ BULK RETURN MODAL ═══════════════════ */}
      {showBulkReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Bulk Return Books</h3>
              <button onClick={() => { setShowBulkReturnModal(false); setBulkReturnSelected(new Set()); setBulkReturnClass(''); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Mode & Filters */}
            <div className="px-6 pt-4 pb-2 space-y-3">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => { setBulkReturnMode('class'); setBulkReturnSelected(new Set()); }}
                  className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                    bulkReturnMode === 'class' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >🏫 By Class</button>
                <button
                  onClick={() => { setBulkReturnMode('individual'); setBulkReturnSelected(new Set()); }}
                  className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                    bulkReturnMode === 'individual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >👤 Individual</button>
              </div>

              {bulkReturnMode === 'class' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Class *</label>
                    <select
                      value={bulkReturnClass}
                      onChange={(e) => { setBulkReturnClass(e.target.value); setBulkReturnSelected(new Set()); }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">— Select Class —</option>
                      {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Condition on Return</label>
                    <select
                      value={bulkReturnCondition}
                      onChange={(e) => setBulkReturnCondition(e.target.value as BookCondition)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {BOOK_CONDITIONS.filter(c => c.value !== 'lost').map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {bulkReturnMode === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condition on Return</label>
                  <select
                    value={bulkReturnCondition}
                    onChange={(e) => setBulkReturnCondition(e.target.value as BookCondition)}
                    className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {BOOK_CONDITIONS.filter(c => c.value !== 'lost').map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={bulkReturnNotes}
                  onChange={(e) => setBulkReturnNotes(e.target.value)}
                  placeholder="Bulk return notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Info */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  📚 {activeBorrowingsForBulkReturn.length} active borrowing(s)
                </span>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  ✅ {bulkReturnSelected.size} selected for return
                </span>
              </div>
            </div>

            {/* Borrowings Table */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {activeBorrowingsForBulkReturn.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {bulkReturnMode === 'class' && !bulkReturnClass ? 'Select a class to view active borrowings.' : 'No active borrowings found.'}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">
                            <input
                              type="checkbox"
                              checked={bulkReturnSelected.size === activeBorrowingsForBulkReturn.length && activeBorrowingsForBulkReturn.length > 0}
                              onChange={toggleBulkReturnAll}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Book</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Copy ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Member</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Class</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Due Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeBorrowingsForBulkReturn.map(record => {
                          const statusInfo = BORROWING_STATUS_LABELS[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-800' };
                          const isChecked = bulkReturnSelected.has(record.id);
                          return (
                            <tr key={record.id} className={`hover:bg-slate-50 ${isChecked ? 'bg-emerald-50' : ''}`}>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleBulkReturnSelect(record.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <p className="text-sm font-medium text-slate-800">{record.book.title}</p>
                              </td>
                              <td className="px-3 py-2">
                                {(record as any).copy_uid ? (
                                  <span className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono rounded">{(record as any).copy_uid}</span>
                                ) : <span className="text-xs text-slate-400">—</span>}
                              </td>
                              <td className="px-3 py-2">
                                <p className="text-sm text-slate-800">{record.member.full_name}</p>
                                <p className="text-xs text-slate-500">{record.member.admission_number || ''}</p>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-600">{record.member.grade || '—'}</td>
                              <td className="px-3 py-2 text-sm text-slate-600">{formatDate(record.due_date)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
              <button onClick={() => { setShowBulkReturnModal(false); setBulkReturnSelected(new Set()); setBulkReturnClass(''); }} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleBulkReturn}
                disabled={submitting || bulkReturnSelected.size === 0}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  `Return ${bulkReturnSelected.size} Book${bulkReturnSelected.size !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowingTab;

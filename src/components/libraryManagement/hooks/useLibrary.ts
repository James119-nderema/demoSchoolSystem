/**
 * Custom hooks for library management state and operations
 * Connected to real backend API endpoints via libraryService
 */

import { useState, useEffect, useCallback } from 'react';
import { libraryService } from '../services/libraryService';
import { APIService } from '../../../services/baseUrl';
import { DEFAULT_LIBRARY_SETTINGS } from '../constants/cbcConstants';
import type {
  Book,
  BookFormData,
  BorrowingRecord,
  LibraryMember,
  LibraryDashboardStats,
  DashboardData,
  CirculationStats,
  OverdueEntry,
  PopularBookEntry,
  InventoryEntry,
  ProjectResourceRequest,
  ReadingCornerEntry,
  LibrarySettings,
  IssueBorrowingData,
  ReturnData,
} from '../types';

// ─── Main Dashboard Hook (uses existing backend endpoints) ───────────────────
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from existing endpoints in parallel
      const [studentsRes, classesRes, subjectsRes, statsRes] = await Promise.allSettled([
        APIService.get<{ count: number }>('/api/students/', { page: '1', page_size: '1' }, 'staff'),
        APIService.get<{ count: number }>('/api/classes/', { page: '1', page_size: '1' }, 'staff'),
        APIService.get<{ count: number }>('/api/subjects/', { page: '1', page_size: '1' }, 'staff'),
        APIService.get<any>('/api/statistics/school_dashboard/', {}, 'staff'),
      ]);

      const totalStudents = studentsRes.status === 'fulfilled'
        ? (studentsRes.value.count ?? 0)
        : 0;

      const totalClasses = classesRes.status === 'fulfilled'
        ? (classesRes.value.count ?? 0)
        : 0;

      const totalSubjects = subjectsRes.status === 'fulfilled'
        ? (subjectsRes.value.count ?? 0)
        : 0;

      const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null;

      const dashboardData: DashboardData = {
        school_overview: {
          total_students: totalStudents,
          total_classes: totalClasses,
          total_subjects: totalSubjects,
          total_assessments: statsData?.school_overview?.total_assessments ?? 0,
          overall_average: statsData?.school_overview?.overall_average ?? 0,
        },
        performance_summary: statsData?.performance_summary ?? {
          excellent: 0, good: 0, average: 0, below_average: 0,
        },
        class_rankings_by_stream: statsData?.class_rankings_by_stream ?? {},
        top_subjects: statsData?.top_subjects ?? [],
      };

      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

// ─── Library-specific Dashboard Hook ─────────────────────────────────────────
export function useLibraryDashboard() {
  const [stats, setStats] = useState<LibraryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await libraryService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load library dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

// ─── Book Catalog Hook ───────────────────────────────────────────────────────
export function useBookCatalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchBooks = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      const data = await libraryService.getBooks(params || filters);
      setBooks(data.results || []);
      setTotalCount(data.count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load books');
      setBooks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const addBook = async (data: BookFormData) => {
    const book = await libraryService.createBook(data);
    setBooks(prev => [book, ...prev]);
    setTotalCount(prev => prev + 1);
    return book;
  };

  const updateBook = async (id: string, data: Partial<BookFormData>) => {
    const updated = await libraryService.updateBook(id, data);
    setBooks(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  };

  const deleteBook = async (id: string) => {
    await libraryService.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setTotalCount(prev => prev - 1);
  };

  return { books, totalCount, loading, error, filters, setFilters, fetchBooks, addBook, updateBook, deleteBook };
}

// ─── Borrowing Hook ──────────────────────────────────────────────────────────
export function useBorrowing() {
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [overdueList, setOverdueList] = useState<OverdueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBorrowings = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      const data = await libraryService.getBorrowings(params);
      setBorrowings(data.results || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load borrowings');
      setBorrowings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverdue = useCallback(async () => {
    try {
      const data = await libraryService.getOverdue();
      setOverdueList(data.results || []);
    } catch {
      setOverdueList([]);
    }
  }, []);

  useEffect(() => {
    fetchBorrowings();
    fetchOverdue();
  }, [fetchBorrowings, fetchOverdue]);

  const issueBook = async (data: IssueBorrowingData) => {
    const record = await libraryService.issueBook(data);
    setBorrowings(prev => [record, ...prev]);
    return record;
  };

  const returnBook = async (data: ReturnData) => {
    const record = await libraryService.returnBook(data);
    setBorrowings(prev => prev.map(b => b.id === data.borrowing_id ? record : b));
    return record;
  };

  const renewBook = async (borrowingId: string) => {
    const record = await libraryService.renewBook(borrowingId);
    setBorrowings(prev => prev.map(b => b.id === borrowingId ? record : b));
    return record;
  };

  return { borrowings, overdueList, loading, error, fetchBorrowings, fetchOverdue, issueBook, returnBook, renewBook };
}

// ─── Members Hook ────────────────────────────────────────────────────────────
export function useLibraryMembers() {
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      const data = await libraryService.getMembers(params);
      setMembers(data.results || []);
      setTotalCount(data.count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
      setMembers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, totalCount, loading, error, fetchMembers };
}

// ─── Reports Hook ────────────────────────────────────────────────────────────
export function useLibraryReports() {
  const [circulationStats, setCirculationStats] = useState<CirculationStats | null>(null);
  const [popularBooks, setPopularBooks] = useState<PopularBookEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [overdueReport, setOverdueReport] = useState<OverdueEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCirculation = async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const data = await libraryService.getCirculationStats(params);
      setCirculationStats(data);
    } catch { setCirculationStats(null); }
    setLoading(false);
  };

  const fetchPopular = async (params?: Record<string, string>) => {
    try {
      const data = await libraryService.getPopularBooks(params);
      setPopularBooks(data);
    } catch { setPopularBooks([]); }
  };

  const fetchInventory = async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const data = await libraryService.getInventoryReport(params);
      setInventory(data);
    } catch { setInventory([]); }
    setLoading(false);
  };

  const fetchOverdueReport = async (params?: Record<string, string>) => {
    try {
      const data = await libraryService.getOverdueReport(params);
      setOverdueReport(data);
    } catch { setOverdueReport([]); }
  };

  return {
    circulationStats, popularBooks, inventory, overdueReport, loading,
    fetchCirculation, fetchPopular, fetchInventory, fetchOverdueReport,
  };
}

// ─── CBC Resources Hook ──────────────────────────────────────────────────────
export function useCBCResources() {
  const [projectRequests, setProjectRequests] = useState<ProjectResourceRequest[]>([]);
  const [readingLogs, setReadingLogs] = useState<ReadingCornerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectRequests = useCallback(async (params?: Record<string, string>) => {
    try {
      const data = await libraryService.getProjectRequests(params);
      setProjectRequests(data.results || []);
    } catch { setProjectRequests([]); }
  }, []);

  const fetchReadingLogs = useCallback(async (params?: Record<string, string>) => {
    try {
      const data = await libraryService.getReadingLogs(params);
      setReadingLogs(data.results || []);
    } catch { setReadingLogs([]); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProjectRequests(), fetchReadingLogs()]).finally(() => setLoading(false));
  }, [fetchProjectRequests, fetchReadingLogs]);

  return { projectRequests, readingLogs, loading, fetchProjectRequests, fetchReadingLogs };
}

// ─── Settings Hook ───────────────────────────────────────────────────────────
export function useLibrarySettings() {
  const [settings, setSettings] = useState<LibrarySettings>(DEFAULT_LIBRARY_SETTINGS as LibrarySettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryService.getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_LIBRARY_SETTINGS as LibrarySettings))
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = async (data: Partial<LibrarySettings>) => {
    const updated = await libraryService.updateSettings(data);
    setSettings(updated);
    return updated;
  };

  return { settings, loading, updateSettings };
}

// ─── Student Members Hook (from existing /api/students/) ─────────────────────
export interface StudentRecord {
  id: string;
  surname: string;
  first_name: string;
  other_names?: string;
  full_name: string;
  gender: string;
  date_of_birth?: string;
  admission_number: string;
  class_field: string;
  class_name: string;
  current_class: string;
  status: string;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_email?: string;
  age?: number;
}

export function useStudentMembers() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.get<{ count: number; results: StudentRecord[] }>(
        '/api/students/',
        { page_size: '100', ...params },
        'staff',
      );
      setStudents(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
      setStudents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return { students, totalCount, loading, error, fetchStudents };
}

// ─── Staff Members Hook (from existing /api/teachers/) ───────────────────────
export interface StaffRecord {
  id: string;
  full_name: string;
  staff_number: string;
  email: string;
  role: string;
  phone_number?: string;
  school_name?: string;
  date_joined?: string;
}

export function useStaffMembers() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.get<{ count: number; results: StaffRecord[] }>(
        '/api/teachers/',
        { page_size: '100', ...params },
        'staff',
      );
      setStaff(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff');
      setStaff([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  return { staff, totalCount, loading, error, fetchStaff };
}

// ─── Bulk Upload Hook ────────────────────────────────────────────────────────
export function useBulkUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const uploadStudents = async (file: File): Promise<any> => {
    setUploading(true);
    setError(null);
    setProgress('Uploading and processing file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await APIService.uploadWithProgress('/api/students/bulk_upload/', formData, (pct) => {
        setProgress(`Uploading... ${pct}%`);
      }, 'staff');

      let msg = `Successfully uploaded ${result.created_count} students.`;
      if ((result as any).updated_count > 0) {
        msg += ` ${(result as any).updated_count} student(s) updated.`;
      }
      if (result.classes_created_count > 0) {
        msg += ` ${result.classes_created_count} new class(es) created.`;
      }
      if (result.error_count > 0) {
        msg += ` ${result.error_count} error(s).`;
      }
      setProgress(msg);
      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Upload failed';
      setError(errorMsg);
      setProgress('');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, progress, error, uploadStudents, setProgress, setError };
}

// ─── Book Bulk Upload Hook ───────────────────────────────────────────────────
export function useBookBulkUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created_count: number;
    error_count: number;
    total_rows: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const uploadBooks = async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress('Uploading and processing file...');
    setResult(null);

    try {
      const res = await libraryService.bulkUploadBooks(file);
      setResult(res);
      let msg = `Successfully uploaded ${res.created_count} book(s).`;
      if (res.error_count > 0) {
        msg += ` ${res.error_count} error(s) encountered.`;
      }
      setProgress(msg);
      return res;
    } catch (err: any) {
      const errorMsg = err.error || err.detail || err.message || 'Upload failed';
      setError(errorMsg);
      setProgress('');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress('');
    setError(null);
    setResult(null);
  };

  return { uploading, progress, error, result, uploadBooks, reset };
}

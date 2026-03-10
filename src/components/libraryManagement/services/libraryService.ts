/**
 * Library Management API Service
 * Uses the existing APIService pattern from baseUrl.ts
 */

import { APIService } from '../../../services/baseUrl';
import type {
  Book,
  BookFormData,
  BookCopy,
  BookCopyFormData,
  BorrowingRecord,
  IssueBorrowingData,
  ReturnData,
  ClassBorrowingData,
  LibraryMember,
  ProjectResourceRequest,
  ReadingCornerEntry,
  LibraryDashboardStats,
  CirculationStats,
  PopularBookEntry,
  OverdueEntry,
  InventoryEntry,
  ProcurementRequest,
  LibrarySettings,
} from '../types';

const BASE = '/api/library';

export const libraryService = {
  // ─── Dashboard ──────────────────────────────────────────────────────────
  getDashboardStats: () =>
    APIService.get<LibraryDashboardStats>(`${BASE}/dashboard/`, {}, 'staff'),

  // ─── Book Catalog ───────────────────────────────────────────────────────
  getBooks: (params?: Record<string, string>) =>
    APIService.get<{ results: Book[]; count: number }>(`${BASE}/books/`, { page_size: '5000', ...params }, 'staff'),

  getBook: (id: string) =>
    APIService.get<Book>(`${BASE}/books/${id}/`, {}, 'staff'),

  createBook: (data: BookFormData) =>
    APIService.post<Book>(`${BASE}/books/`, data, 'staff'),

  updateBook: (id: string, data: Partial<BookFormData>) =>
    APIService.patch<Book>(`${BASE}/books/${id}/`, data, 'staff'),

  deleteBook: (id: string) =>
    APIService.delete(`${BASE}/books/${id}/`, 'staff'),

  bulkUploadBooks: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return APIService.fetch<{
      created_count: number;
      error_count: number;
      total_rows: number;
      errors: { row: number; error: string }[];
    }>(`${BASE}/books/bulk_upload/`, { method: 'POST', body: formData }, 'staff');
  },

  searchBooks: (query: string, params?: Record<string, string>) =>
    APIService.get<{ results: Book[]; count: number }>(`${BASE}/books/`, { search: query, ...params }, 'staff'),

  // ─── Book Copies (unique identifiers per physical copy) ─────────────────
  getBookCopies: (bookId: string) =>
    APIService.get<{ results: BookCopy[]; count: number }>(`${BASE}/books/${bookId}/copies/`, {}, 'staff'),

  addBookCopy: (bookId: string, data: BookCopyFormData) =>
    APIService.post<BookCopy>(`${BASE}/books/${bookId}/copies/`, data, 'staff'),

  deleteBookCopy: (bookId: string, copyId: string) =>
    APIService.delete(`${BASE}/books/${bookId}/copies/${copyId}/`, 'staff'),

  searchBookCopies: (query: string) =>
    APIService.get<{ results: BookCopy[]; count: number }>(`${BASE}/book-copies/`, { search: query }, 'staff'),

  // ─── Members ────────────────────────────────────────────────────────────
  getMembers: (params?: Record<string, string>) =>
    APIService.get<{ results: LibraryMember[]; count: number }>(`${BASE}/members/`, params, 'staff'),

  getMember: (id: string) =>
    APIService.get<LibraryMember>(`${BASE}/members/${id}/`, {}, 'staff'),

  createMember: (data: Partial<LibraryMember>) =>
    APIService.post<LibraryMember>(`${BASE}/members/`, data, 'staff'),

  updateMember: (id: string, data: Partial<LibraryMember>) =>
    APIService.patch<LibraryMember>(`${BASE}/members/${id}/`, data, 'staff'),

  // ─── Borrowing ──────────────────────────────────────────────────────────
  getBorrowings: (params?: Record<string, string>) =>
    APIService.get<{ results: BorrowingRecord[]; count: number }>(`${BASE}/borrowings/`, params, 'staff'),

  issueBook: (data: IssueBorrowingData) =>
    APIService.post<BorrowingRecord>(`${BASE}/borrowings/issue/`, data, 'staff'),

  returnBook: (data: ReturnData) =>
    APIService.post<BorrowingRecord>(`${BASE}/borrowings/return/`, data, 'staff'),

  renewBook: (borrowingId: string) =>
    APIService.post<BorrowingRecord>(`${BASE}/borrowings/${borrowingId}/renew/`, {}, 'staff'),

  getOverdue: (params?: Record<string, string>) =>
    APIService.get<{ results: OverdueEntry[]; count: number }>(`${BASE}/borrowings/overdue/`, params, 'staff'),

  issueClassBooks: (data: ClassBorrowingData) =>
    APIService.post<{ success: boolean; issued_count: number; records: BorrowingRecord[] }>(`${BASE}/borrowings/issue-class/`, data, 'staff'),

  returnClassBooks: (borrowingIds: string[], condition?: string, notes?: string) =>
    APIService.post<{ returned_count: number; error_count: number; records: BorrowingRecord[]; errors: any[] }>(
      `${BASE}/borrowings/return-class/`,
      { borrowing_ids: borrowingIds, condition: condition || 'good', notes: notes || '' },
      'staff',
    ),

  getMemberBorrowings: (memberId: string, params?: Record<string, string>) =>
    APIService.get<{ results: BorrowingRecord[]; count: number }>(`${BASE}/borrowings/`, { member_id: memberId, ...params }, 'staff'),

  // ─── Fines ──────────────────────────────────────────────────────────────
  payFine: (borrowingId: string, amount: number) =>
    APIService.post(`${BASE}/borrowings/${borrowingId}/pay-fine/`, { amount }, 'staff'),

  waiveFine: (borrowingId: string, reason: string) =>
    APIService.post(`${BASE}/borrowings/${borrowingId}/waive-fine/`, { reason }, 'staff'),

  markLost: (borrowingId: string) =>
    APIService.post<{ status: string; borrowing: BorrowingRecord; invoice_created: boolean; charge_amount: number }>(
      `${BASE}/borrowings/${borrowingId}/mark-lost/`, {}, 'staff',
    ),

  // ─── CBC Project Resources ─────────────────────────────────────────────
  getProjectRequests: (params?: Record<string, string>) =>
    APIService.get<{ results: ProjectResourceRequest[]; count: number }>(`${BASE}/project-resources/`, params, 'staff'),

  createProjectRequest: (data: Partial<ProjectResourceRequest>) =>
    APIService.post<ProjectResourceRequest>(`${BASE}/project-resources/`, data, 'staff'),

  updateProjectRequest: (id: string, data: Partial<ProjectResourceRequest>) =>
    APIService.patch<ProjectResourceRequest>(`${BASE}/project-resources/${id}/`, data, 'staff'),

  // ─── Reading Corner ────────────────────────────────────────────────────
  getReadingLogs: (params?: Record<string, string>) =>
    APIService.get<{ results: ReadingCornerEntry[]; count: number }>(`${BASE}/reading-logs/`, params, 'staff'),

  createReadingLog: (data: Partial<ReadingCornerEntry>) =>
    APIService.post<ReadingCornerEntry>(`${BASE}/reading-logs/`, data, 'staff'),

  // ─── Reports ────────────────────────────────────────────────────────────
  getCirculationStats: (params?: Record<string, string>) =>
    APIService.get<CirculationStats>(`${BASE}/reports/circulation/`, params, 'staff'),

  getPopularBooks: (params?: Record<string, string>) =>
    APIService.get<PopularBookEntry[]>(`${BASE}/reports/popular/`, params, 'staff'),

  getInventoryReport: (params?: Record<string, string>) =>
    APIService.get<InventoryEntry[]>(`${BASE}/reports/inventory/`, params, 'staff'),

  getOverdueReport: (params?: Record<string, string>) =>
    APIService.get<OverdueEntry[]>(`${BASE}/reports/overdue/`, params, 'staff'),

  // ─── Procurement ────────────────────────────────────────────────────────
  getProcurementRequests: (params?: Record<string, string>) =>
    APIService.get<{ results: ProcurementRequest[]; count: number }>(`${BASE}/procurement/`, params, 'staff'),

  createProcurementRequest: (data: Partial<ProcurementRequest>) =>
    APIService.post<ProcurementRequest>(`${BASE}/procurement/`, data, 'staff'),

  updateProcurementRequest: (id: string, data: Partial<ProcurementRequest>) =>
    APIService.patch<ProcurementRequest>(`${BASE}/procurement/${id}/`, data, 'staff'),

  // ─── Settings ───────────────────────────────────────────────────────────
  getSettings: () =>
    APIService.get<LibrarySettings>(`${BASE}/settings/`, {}, 'staff'),

  updateSettings: (data: Partial<LibrarySettings>) =>
    APIService.patch<LibrarySettings>(`${BASE}/settings/`, data, 'staff'),
};

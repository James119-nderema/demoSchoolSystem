/**
 * Members Tab — List students & staff from existing school APIs
 * Includes search, filters, add member button, and CSV/XLSX bulk upload
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  useStudentMembers,
  useStaffMembers,
  useBulkUpload,
} from '../hooks/useLibrary';
import type { StudentRecord, StaffRecord } from '../hooks/useLibrary';
import TablePagination, { usePagination } from '../utils/TablePagination';

type ActiveTab = 'students' | 'staff';

const MembersTab: React.FC = () => {
  /* ─── Data hooks ──────────────────────────────────────────────────────── */
  const { students, totalCount: studentCount, loading: studentsLoading, loadingMore: studentsLoadingMore, error: studentsError, fetchStudents } = useStudentMembers();
  const { staff, totalCount: staffCount, loading: staffLoading, loadingMore: staffLoadingMore, error: staffError, fetchStaff } = useStaffMembers();
  const { uploading, progress, error: uploadError, uploadStudents, setProgress, setError: setUploadError } = useBulkUpload();

  /* ─── Local state ─────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loading = activeTab === 'students' ? studentsLoading : staffLoading;
  const loadingMore = activeTab === 'students' ? studentsLoadingMore : staffLoadingMore;
  const error = activeTab === 'students' ? studentsError : staffError;

  /* ─── Derived data ────────────────────────────────────────────────────── */
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.class_name) set.add(s.class_name); });
    return Array.from(set).sort();
  }, [students]);

  const uniqueRoles = useMemo(() => {
    const set = new Set<string>();
    staff.forEach(s => { if (s.role) set.add(s.role); });
    return Array.from(set).sort();
  }, [staff]);

  /* ─── Filtered lists ──────────────────────────────────────────────────── */
  const filteredStudents = useMemo(() => {
    let list = students;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.admission_number?.toLowerCase().includes(q) ||
        s.class_name?.toLowerCase().includes(q)
      );
    }
    if (classFilter) {
      list = list.filter(s => s.class_name === classFilter || s.current_class === classFilter);
    }
    return list;
  }, [students, search, classFilter]);

  const filteredStaff = useMemo(() => {
    let list = staff;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.staff_number?.toLowerCase().includes(q)
      );
    }
    if (roleFilter) {
      list = list.filter(s => s.role === roleFilter);
    }
    return list;
  }, [staff, search, roleFilter]);

  /* ─── Pagination ──────────────────────────────────────────────────────── */
  const {
    currentPage: studentPage,
    itemsPerPage: studentPerPage,
    paginatedItems: paginatedStudents,
    setPage: setStudentPage,
    setItemsPerPage: setStudentPerPage,
  } = usePagination(filteredStudents, 25);

  const {
    currentPage: staffPage,
    itemsPerPage: staffPerPage,
    paginatedItems: paginatedStaff,
    setPage: setStaffPage,
    setItemsPerPage: setStaffPerPage,
  } = usePagination(filteredStaff, 25);

  /* ─── Handlers ────────────────────────────────────────────────────────── */
  const handleServerSearch = () => {
    if (activeTab === 'students') {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (classFilter) params['class'] = classFilter;
      fetchStudents(params);
    } else {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      fetchStaff(params);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      await uploadStudents(uploadFile);
      setUploadFile(null);
      setShowUploadModal(false);
      fetchStudents(); // refresh list
    } catch {
      // error is already set in the hook
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xml', 'xlsx', 'xls'].includes(ext || '')) {
        setUploadError('Please select a CSV, XML, or Excel (.xlsx/.xls) file');
        return;
      }
    }
    setUploadFile(file);
    setUploadError(null);
    setProgress('');
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500">
            {studentCount} students · {staffCount} staff members
            {loadingMore && <span className="ml-2 text-indigo-500 animate-pulse">· loading more…</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowUploadModal(true); setUploadError(null); setProgress(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Students (CSV)
          </button>
          <button
            onClick={() => activeTab === 'students' ? fetchStudents() : fetchStaff()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('students'); setSearch(''); setClassFilter(''); setRoleFilter(''); }}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Students ({studentCount})
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('staff'); setSearch(''); setClassFilter(''); setRoleFilter(''); }}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Staff ({staffCount})
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleServerSearch()}
                placeholder={activeTab === 'students' ? 'Search by name or admission number...' : 'Search by name, email, or staff number...'}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {activeTab === 'students' ? (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            ) : (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleServerSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Students Table */}
      {activeTab === 'students' && (
        loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <svg className="mx-auto w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            <p className="text-slate-500 font-medium">No students found</p>
            <p className="text-slate-400 text-sm mt-1">Upload a CSV file to add students</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Admission No.</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Class</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Gender</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Guardian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{(studentPage - 1) * studentPerPage + idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials(student.full_name || `${student.surname} ${student.first_name}`)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{student.full_name || `${student.surname} ${student.first_name}`}</p>
                            {student.age && <p className="text-xs text-slate-400">{student.age} years old</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{student.admission_number}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {student.class_name || student.current_class}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">{student.gender}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          student.status === 'active' ? 'bg-green-50 text-green-700' :
                          student.status === 'inactive' ? 'bg-red-50 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-[150px] truncate">
                        {student.parent_guardian_name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              totalItems={filteredStudents.length}
              currentPage={studentPage}
              itemsPerPage={studentPerPage}
              onPageChange={setStudentPage}
              onItemsPerPageChange={setStudentPerPage}
              itemLabel="students"
            />
            {studentsLoadingMore && (
              <div className="flex items-center justify-center gap-2 py-2 bg-indigo-50 border-t border-indigo-100 text-indigo-600 text-xs font-medium">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-300 border-t-indigo-600" />
                Loading more students… ({students.length} of {studentCount})
              </div>
            )}
          </div>
        )
      )}

      {/* Staff Table */}
      {activeTab === 'staff' && (
        loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <svg className="mx-auto w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <p className="text-slate-500 font-medium">No staff members found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Staff Member</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Staff No.</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStaff.map((member, idx) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStaff(member)}
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{(staffPage - 1) * staffPerPage + idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials(member.full_name)}
                          </div>
                          <p className="font-medium text-slate-800">{member.full_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{member.staff_number}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          member.role === 'LIBRARIAN' ? 'bg-purple-50 text-purple-700' :
                          member.role === 'TEACHER' ? 'bg-blue-50 text-blue-700' :
                          member.role === 'HOD' ? 'bg-amber-50 text-amber-700' :
                          member.role === 'DIRECTOR_OF_STUDIES' ? 'bg-teal-50 text-teal-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {member.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              totalItems={filteredStaff.length}
              currentPage={staffPage}
              itemsPerPage={staffPerPage}
              onPageChange={setStaffPage}
              onItemsPerPageChange={setStaffPerPage}
              itemLabel="staff members"
            />
            {staffLoadingMore && (
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 border-t border-emerald-100 text-emerald-600 text-xs font-medium">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-300 border-t-emerald-600" />
                Loading more staff… ({staff.length} of {staffCount})
              </div>
            )}
          </div>
        )
      )}

      {/* ─── Student Detail Modal ─────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Student Details</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold">
                  {initials(selectedStudent.full_name || `${selectedStudent.surname} ${selectedStudent.first_name}`)}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{selectedStudent.full_name || `${selectedStudent.surname} ${selectedStudent.first_name}`}</p>
                  <p className="text-sm text-slate-500">Student</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Admission No.</p>
                  <p className="text-sm font-medium text-slate-800">{selectedStudent.admission_number}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-medium text-slate-800">{selectedStudent.class_name || selectedStudent.current_class}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Gender</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">{selectedStudent.gender}</p>
                </div>
                {selectedStudent.age && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Age</p>
                    <p className="text-sm font-medium text-slate-800">{selectedStudent.age} years</p>
                  </div>
                )}
                {selectedStudent.date_of_birth && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Date of Birth</p>
                    <p className="text-sm font-medium text-slate-800">{selectedStudent.date_of_birth}</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`text-sm font-medium capitalize ${selectedStudent.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                    {selectedStudent.status}
                  </p>
                </div>
                {selectedStudent.parent_guardian_name && (
                  <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-slate-500">Parent / Guardian</p>
                    <p className="text-sm font-medium text-slate-800">{selectedStudent.parent_guardian_name}</p>
                    {selectedStudent.parent_guardian_phone && (
                      <p className="text-xs text-slate-400 mt-0.5">{selectedStudent.parent_guardian_phone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Staff Detail Modal ───────────────────────────────────────────── */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStaff(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Staff Details</h3>
              <button onClick={() => setSelectedStaff(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                  {initials(selectedStaff.full_name)}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{selectedStaff.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedStaff.role?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Staff Number</p>
                  <p className="text-sm font-medium text-slate-800">{selectedStaff.staff_number}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{selectedStaff.email}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="text-sm font-medium text-slate-800">{selectedStaff.role?.replace(/_/g, ' ')}</p>
                </div>
                {selectedStaff.phone_number && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-800">{selectedStaff.phone_number}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedStaff(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Modal ─────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpload}>
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Upload Students File</h3>
                <button type="button" onClick={() => !uploading && setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Drop zone */}
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xml,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <svg className="mx-auto w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-slate-600 font-medium">Click to select a file or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">CSV, XML, XLSX up to 50MB</p>
                </div>

                {/* Selected file */}
                {uploadFile && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-slate-700 flex-1 truncate">{uploadFile.name}</span>
                    <span className="text-xs text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                    <button type="button" onClick={() => setUploadFile(null)} className="text-red-400 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {/* Format info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Required CSV Columns</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <code className="bg-blue-100 px-1 rounded">admission_number</code>,{' '}
                    <code className="bg-blue-100 px-1 rounded">surname</code>,{' '}
                    <code className="bg-blue-100 px-1 rounded">first_name</code>,{' '}
                    <code className="bg-blue-100 px-1 rounded">gender</code>,{' '}
                    <code className="bg-blue-100 px-1 rounded">class_name</code>
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Optional: other_names, date_of_birth, upi_no, assessment_no, birth_entry_no, disability,
                    parent_guardian_name, parent_guardian_phone, parent_guardian_email, address
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <a
                      href="/sample_students_new_format.csv"
                      download="sample_students_new_format.csv"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Sample CSV
                    </a>
                  </div>
                </div>

                {/* Upload progress / success */}
                {progress && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-700">{progress}</p>
                  </div>
                )}

                {/* Upload error */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !uploading && setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                    !uploadFile || uploading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Students
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersTab;

import React, { useState, useEffect } from 'react';
import { APIService } from '../../services/baseUrl';

interface StaffInfo {
  id: string;
  email: string;
  full_name: string;
  school_id: number;
  school_name: string;
  phone_number: string;
  role?: string;
}

interface ClassData {
  id: string;
  class_name: string;
  class_code: string;
  description: string;
}

interface SubjectData {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string;
}

interface Assignment {
  id?: string;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  is_class_teacher?: boolean;
}

interface ClassSubjectAssignment {
  class_id: string;
  subject_ids: string[];
  is_class_teacher: boolean;
}

const StaffProfile: React.FC = () => {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssignmentEditing, setIsAssignmentEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classSubjectAssignments, setClassSubjectAssignments] = useState<ClassSubjectAssignment[]>([]);

  useEffect(() => {
    const info = localStorage.getItem('staff_info');
    if (info) {
      try {
        setStaffInfo(JSON.parse(info));
        fetchProfileData();
      } catch (error) {
        console.error('Error parsing staff info:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch available classes and subjects first
      const availableResponse = await APIService.get('/api/staff/profile/available_classes_subjects/');
      if (availableResponse.classes) {
        setClasses(availableResponse.classes);
      }
      if (availableResponse.subjects) {
        setSubjects(availableResponse.subjects);
      }

      // Fetch profile and assignments after classes/subjects are loaded
      const profileResponse = await APIService.get('/api/staff/profile/my_profile/');
      if (profileResponse.assignments) {
        setAssignments(profileResponse.assignments);
        // Group assignments by class for editing after both classes and subjects are loaded
        setTimeout(() => {
          groupAssignmentsByClass(profileResponse.assignments, availableResponse.classes, availableResponse.subjects);
        }, 100);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupAssignmentsByClass = (assignmentsList: Assignment[], classesData?: ClassData[], subjectsData?: SubjectData[]) => {
    const grouped: { [key: string]: ClassSubjectAssignment } = {};
    
    // Use provided data or fall back to state
    const availableClasses = classesData || classes;
    const availableSubjects = subjectsData || subjects;
    
    assignmentsList.forEach(assignment => {
      const classObj = availableClasses.find(c => c.class_name === assignment.class_name);
      const classId = classObj?.id;
      
      if (classId) {
        if (!grouped[classId]) {
          grouped[classId] = {
            class_id: classId,
            subject_ids: [],
            is_class_teacher: assignment.is_class_teacher || false
          };
        }
        
        const subjectObj = availableSubjects.find(s => s.subject_name === assignment.subject_name);
        const subjectId = subjectObj?.id;
        
        if (subjectId && !grouped[classId].subject_ids.includes(subjectId)) {
          grouped[classId].subject_ids.push(subjectId);
        }
      }
    });

    const groupedAssignments = Object.values(grouped);
    setClassSubjectAssignments(groupedAssignments);
  };

  const handleAddClassAssignment = () => {
    setClassSubjectAssignments([
      ...classSubjectAssignments,
      { class_id: '', subject_ids: [], is_class_teacher: false }
    ]);
  };

  const handleRemoveClassAssignment = (index: number) => {
    const updated = classSubjectAssignments.filter((_, i) => i !== index);
    setClassSubjectAssignments(updated);
  };

  const handleClassChange = (index: number, classId: string) => {
    const updated = [...classSubjectAssignments];
    updated[index] = { ...updated[index], class_id: classId };
    setClassSubjectAssignments(updated);
  };

  const handleSubjectChange = (index: number, subjectId: string, checked: boolean) => {
    const updated = [...classSubjectAssignments];
    if (checked) {
      if (!updated[index].subject_ids.includes(subjectId)) {
        updated[index].subject_ids.push(subjectId);
      }
    } else {
      updated[index].subject_ids = updated[index].subject_ids.filter(id => id !== subjectId);
    }
    setClassSubjectAssignments(updated);
  };

  const handleSaveAssignments = async () => {
    try {
      setSaving(true);
      const validAssignments = classSubjectAssignments.filter(
        assignment => assignment.class_id !== '' && assignment.subject_ids.length > 0
      );

      if (validAssignments.length === 0) {
        alert('Please add at least one valid assignment with a class and subjects selected.');
        return;
      }

      await APIService.post('/api/staff/profile/update_assignments/', {
        assignments: validAssignments
      });

      alert('Assignments updated successfully!');
      setIsAssignmentEditing(false);
      fetchProfileData(); // Refresh data
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Error saving assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!staffInfo || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roleLabel = staffInfo.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Staff';
  const avatarSeed = encodeURIComponent((staffInfo.full_name || staffInfo.email || 'staff').trim());
  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${avatarSeed}&radius=50&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  // Group assignments by class name for display
  const groupedAssignments: { [key: string]: Assignment[] } = {};
  assignments.forEach(a => {
    const key = a.class_name || 'Unknown';
    if (!groupedAssignments[key]) groupedAssignments[key] = [];
    groupedAssignments[key].push(a);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      

      {/* ─── Profile Card (overlaps hero) ────────────────────────────── */}
      <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Profile strip */}
          <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-200/60 flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/90 bg-white">
                <img
                  src={avatarUrl}
                  alt={`${staffInfo.full_name} avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name & role */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{staffInfo.full_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {roleLabel}
                </span>
                <span className="text-sm text-slate-400">{staffInfo.school_name}</span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isEditing
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-200/60'
              }`}
            >
              {isEditing ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* ─── Personal Info Grid ─────────────────────────────────── */}
          <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
                  {isEditing ? (
                    <input type="text" defaultValue={staffInfo.full_name}
                      className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-800">{staffInfo.full_name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</label>
                  {isEditing ? (
                    <input type="email" defaultValue={staffInfo.email}
                      className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-800">{staffInfo.email}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone Number</label>
                  {isEditing ? (
                    <input type="tel" defaultValue={staffInfo.phone_number}
                      className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-800">{staffInfo.phone_number || '—'}</p>
                  )}
                </div>
              </div>

              {/* School */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">School</label>
                  <p className="mt-1 text-sm font-medium text-slate-800">{staffInfo.school_name}</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200/50 transition-all">
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* ─── Security ───────────────────────────────────────────── */}
          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Security</h4>
                  <p className="text-xs text-slate-400">Update your account password</p>
                </div>
              </div>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* ─── Teaching Assignments ────────────────────────────────── */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Teaching Assignments</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} across {Object.keys(groupedAssignments).length} class{Object.keys(groupedAssignments).length !== 1 ? 'es' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                if (!isAssignmentEditing) {
                  if (assignments.length > 0) {
                    groupAssignmentsByClass(assignments, classes, subjects);
                  } else {
                    setClassSubjectAssignments([{ class_id: '', subject_ids: [], is_class_teacher: false }]);
                  }
                }
                setIsAssignmentEditing(!isAssignmentEditing);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isAssignmentEditing
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200/50'
              }`}
            >
              {isAssignmentEditing ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Assignments
                </>
              )}
            </button>
          </div>

          {/* Current Assignments Display */}
          {!isAssignmentEditing && (
            <div className="border-t border-slate-100 px-6 sm:px-8 py-6">
              {assignments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(groupedAssignments).map(([className, classAssignments]) => (
                    <div key={className} className="rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
                      {/* Class header */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-bold text-slate-700">{className}</h4>
                        </div>
                        {classAssignments.some(a => a.is_class_teacher) && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Class Teacher
                          </span>
                        )}
                      </div>
                      {/* Subjects */}
                      <div className="px-4 py-3 space-y-2">
                        {classAssignments.map((assignment, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1.5">
                            <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{assignment.subject_name}</p>
                              <p className="text-[11px] text-slate-400">{assignment.subject_code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">No teaching assignments yet</p>
                  <p className="text-sm text-slate-400 mt-1">Click "Edit Assignments" to add your classes and subjects.</p>
                </div>
              )}
            </div>
          )}

          {/* Assignment Editing Interface */}
          {isAssignmentEditing && (
            <div className="border-t border-slate-100 px-6 sm:px-8 py-6 space-y-5">
              {classSubjectAssignments.map((assignment, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {index + 1}
                      </span>
                      Assignment
                    </h4>
                    <button onClick={() => handleRemoveClassAssignment(index)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Class Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Class</label>
                      <select value={assignment.class_id} onChange={(e) => handleClassChange(index, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                        <option value="">Select a class...</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.class_name} ({cls.class_code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Subjects <span className="text-slate-400 normal-case font-normal">(check all that apply)</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg p-3">
                        {subjects.map(subject => (
                          <label key={subject.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={assignment.subject_ids.includes(subject.id)}
                              onChange={(e) => handleSubjectChange(index, subject.id, e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            <span className="text-sm text-slate-700">{subject.subject_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New */}
              <button onClick={handleAddClassAssignment}
                className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded-xl py-4 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Class Assignment
              </button>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => {
                  setIsAssignmentEditing(false);
                  if (assignments.length > 0) groupAssignmentsByClass(assignments, classes, subjects);
                  else setClassSubjectAssignments([]);
                }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveAssignments} disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200/50 disabled:opacity-50 transition-all">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : 'Save Assignments'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;

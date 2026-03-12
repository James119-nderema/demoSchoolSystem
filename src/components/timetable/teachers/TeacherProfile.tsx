import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, School, Calendar, CheckCircle, XCircle, BookOpen, Users, Clock } from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { teacherSubjectClassService } from '../../../services/teacherSubjectClassService';
import type { Teacher } from '../../../types/teacher';
import type { TeacherSubjectClass } from '../../../services/teacherSubjectClassService';
import { SkeletonProfile, SkeletonTable } from '../../ui/Skeleton';

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<TeacherSubjectClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTeacher();
      fetchAssignments();
    }
  }, [id]);

  const fetchTeacher = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getTeacher(id!);
      if (response.success && response.data) {
        setTeacher(response.data);
      } else {
        setError(response.message || 'Failed to fetch teacher');
      }
    } catch (err) {
      console.error('Error fetching teacher:', err);
      setError('An error occurred while fetching teacher details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const response = await teacherSubjectClassService.getAssignments(1, 100, { teacher_id: id });
      if (response.success && response.data) {
        setAssignments(response.data.results);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Group assignments by subject
  const subjectMap = assignments.reduce((acc, a) => {
    if (!acc[a.subject_name]) {
      acc[a.subject_name] = { code: a.subject_code, classes: [] };
    }
    acc[a.subject_name].classes.push(a.class_name);
    return acc;
  }, {} as Record<string, { code: string; classes: string[] }>);

  // Group assignments by class
  const classMap = assignments.reduce((acc, a) => {
    if (!acc[a.class_name]) {
      acc[a.class_name] = { code: a.class_code, subjects: [] };
    }
    acc[a.class_name].subjects.push(a.subject_name);
    return acc;
  }, {} as Record<string, { code: string; subjects: string[] }>);

  const uniqueSubjects = Object.keys(subjectMap).length;
  const uniqueClasses = Object.keys(classMap).length;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-32" />
        <SkeletonProfile />
        <SkeletonTable rows={5} cols={3} />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="p-4 md:p-6">
        <button
          onClick={() => navigate('/timetable/teachers')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teachers
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Teacher not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/timetable/teachers')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teachers
      </button>

      {/* Teacher Info Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
              {teacher.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl md:text-2xl font-bold text-white">{teacher.full_name}</h1>
              <p className="text-blue-100 text-sm md:text-base">{teacher.email}</p>
              <span
                className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  teacher.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {teacher.is_active ? (
                  <><CheckCircle className="w-3 h-3" /> Active</>
                ) : (
                  <><XCircle className="w-3 h-3" /> Inactive</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">{teacher.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{teacher.phone_number || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-purple-100 p-2 rounded-lg">
              <School className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">School</p>
              <p className="text-sm font-medium text-gray-900 truncate">{teacher.school_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Date Joined</p>
              <p className="text-sm font-medium text-gray-900">
                {teacher.date_joined ? new Date(teacher.date_joined).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueSubjects}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueClasses}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Taught */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Subjects Taught
          </h2>
        </div>
        {assignmentsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(subjectMap).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No subject assignments found for this teacher.</p>
          </div>
        ) : (
          <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(subjectMap).map(([subject, data]) => (
              <div key={subject} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{subject}</h3>
                    <p className="text-xs text-gray-500">{data.code}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Classes:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.classes.map((cls) => (
                      <span
                        key={cls}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classes Assigned */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Classes Assigned
          </h2>
        </div>
        {assignmentsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(classMap).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No class assignments found for this teacher.</p>
          </div>
        ) : (
          <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(classMap).map(([className, data]) => (
              <div key={className} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{className}</h3>
                    <p className="text-xs text-gray-500">{data.code}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Subjects:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Assignments Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            All Assignments
          </h2>
        </div>
        {assignmentsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No assignments found.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{a.subject_name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Code: {a.subject_code}</span>
                    <span>Class: {a.class_name}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.subject_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.subject_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.class_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

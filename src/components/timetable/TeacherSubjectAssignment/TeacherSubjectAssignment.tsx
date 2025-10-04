import { useState, useEffect } from 'react';
import { Plus, Users, BookOpen, GraduationCap, Trash2, Edit2 } from 'lucide-react';
import { teacherSubjectClassService } from '../../../services/teacherSubjectClassService';
import type { TeacherSubjectClass, AssignmentStats } from '../../../services/teacherSubjectClassService';
import AddTeacherAssignmentModal from './AddTeacherAssignmentModal';
import EditTeacherAssignmentModal from './EditTeacherAssignmentModal';

export default function TeacherSubjectAssignment() {
  const [assignments, setAssignments] = useState<TeacherSubjectClass[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherSubjectClass | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAssignments();
    loadStats();
  }, [currentPage, searchTerm]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response = await teacherSubjectClassService.getAssignments(currentPage, 20, filters);
      
      if (response.success && response.data) {
        setAssignments(response.data.results || []);
        setTotalCount(response.data.count || 0);
        setTotalPages(response.data.total_pages || 1);
      } else {
        console.error('Failed to load assignments:', response.message);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await teacherSubjectClassService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    loadAssignments();
    loadStats();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingAssignment(null);
    loadAssignments();
  };

  const handleEdit = (assignment: TeacherSubjectClass) => {
    setEditingAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const result = await teacherSubjectClassService.deleteAssignment(id);
      if (result.success) {
        alert('Assignment deleted successfully');
        loadAssignments();
        loadStats();
      } else {
        alert(result.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Subject Assignment</h1>
              <p className="text-gray-600">Manage teacher-subject-class assignments</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Assignment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_assignments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_assignments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_teachers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Teachers with Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.teachers_with_assignments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            placeholder="Search by teacher name, subject, or class..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No assignments match your search criteria.' : 'Get started by adding your first assignment.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Assignment
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.teacher_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.teacher_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.subject_name}</div>
                          {assignment.subject_code && (
                            <div className="text-sm text-gray-500">{assignment.subject_code}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.class_name}</div>
                          <div className="text-sm text-gray-500">{assignment.class_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              assignment.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {assignment.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(String(assignment.id))}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 20, totalCount)}
                        </span>{' '}
                        of <span className="font-medium">{totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTeacherAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {editingAssignment && (
        <EditTeacherAssignmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAssignment(null);
          }}
          onSuccess={handleEditSuccess}
          assignment={editingAssignment}
        />
      )}
    </div>
  );
}

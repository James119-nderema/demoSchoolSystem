import { useState, useEffect } from 'react';
import type { SubjectPriority } from '../../../types/priorities';
import { prioritiesService } from '../../../services/prioritiesService';
import AddPriorityModal from './AddPriorityModal';
import EditPriorityModal from './EditPriorityModal';

export default function Priorities() {
  const [priorities, setPriorities] = useState<SubjectPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<SubjectPriority | null>(null);
  const pageSize = 20;

  const formatTime = (time: string) => {
    // Remove seconds from time (HH:MM:SS -> HH:MM)
    return time.substring(0, 5);
  };

  useEffect(() => {
    loadPriorities();
  }, [currentPage]);

  const loadPriorities = async () => {
    setLoading(true);
    try {
      const response = await prioritiesService.getPriorities(currentPage, pageSize);
      
      if (response.success && response.data) {
        setPriorities(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / pageSize));
      } else {
        console.error('API response not successful:', response);
      }
    } catch (error) {
      console.error('Failed to load priorities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPriority = async (data: { subject: string; time_slots: string[]; teacher?: string | null }) => {
    try {
      const result = await prioritiesService.bulkCreatePriorities(data);
      if (result.success) {
        await loadPriorities();
        setIsAddModalOpen(false);
        alert(result.message || `${result.created_count} priorities added successfully!`);
      } else {
        throw new Error(result.message || 'Failed to add priorities');
      }
    } catch (error) {
      console.error('Failed to add priorities:', error);
      throw error;
    }
  };

  const handleUpdatePriority = async (id: string, data: { subject: string; time_slot: string }) => {
    try {
      const result = await prioritiesService.updatePriority(id, data);
      if (result.success) {
        await loadPriorities();
        setEditingPriority(null);
        alert('Priority updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      throw error;
    }
  };

  const handleDeletePriority = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this priority?')) {
      return;
    }

    try {
      const result = await prioritiesService.deletePriority(id);
      if (result.success) {
        await loadPriorities();
        alert('Priority deleted successfully!');
      } else {
        alert(result.message || 'Failed to delete priority');
      }
    } catch (error) {
      console.error('Failed to delete priority:', error);
      alert('Failed to delete priority. Please try again.');
    }
  };

  const openAddModal = () => {
    setEditingPriority(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (priority: SubjectPriority) => {
    setEditingPriority(priority);
  };

  const filteredPriorities = priorities.filter(priority => {
    const matchesSearch = priority.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (priority.subject_code && priority.subject_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         priority.time_slot_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (priority.teacher_name && priority.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Priorities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage preferred time slots for subjects
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Priority
        </button>
      </div>
      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by subject, code, teacher, or time slot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPriorities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No priorities</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new subject priority.</p>
            <div className="mt-6">
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Priority
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredPriorities.map((priority) => (
                <div key={priority.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{priority.subject_name}</p>
                      <p className="text-xs text-gray-500">{priority.subject_code || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(priority)}
                        className="text-blue-600 hover:text-blue-900 p-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePriority(priority.id)}
                        className="text-red-600 hover:text-red-900 p-1 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {priority.teacher_name ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">{priority.teacher_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-gray-700">{priority.teacher_name}</span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">All Teachers</span>
                  )}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {priority.time_slot_display}
                    </span>
                    <span className="text-gray-500">{formatTime(priority.start_time)} - {formatTime(priority.end_time)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preferred Time Slot
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPriorities.map((priority) => (
                  <tr key={priority.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{priority.subject_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{priority.subject_code || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {priority.teacher_name ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-indigo-600">
                              {priority.teacher_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{priority.teacher_name}</div>
                            {priority.teacher_email && (
                              <div className="text-xs text-gray-500">{priority.teacher_email}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                          All Teachers
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {priority.time_slot_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(priority.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(priority.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(priority)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePriority(priority.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                      <span className="font-medium">{totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Modals */}
      <AddPriorityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPriority}
      />

      {editingPriority && (
        <EditPriorityModal
          isOpen={true}
          onClose={() => setEditingPriority(null)}
          onSubmit={(data) => handleUpdatePriority(editingPriority.id, data)}
          priority={editingPriority}
        />
      )}
    </div>
  );
}

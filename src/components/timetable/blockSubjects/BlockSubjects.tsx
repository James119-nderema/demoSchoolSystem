import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import blockSubjectService from '../../../services/blockSubjectService';
import type { Block, BlockStatsResponse } from '../../../types/blockSubject';
import AddBlockSubjectModal from './AddBlockSubjectModal';

const BlockSubjects: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<BlockStatsResponse>({
    total_blocks: 0,
    total_subjects_in_blocks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks();
    fetchStats();
  }, [currentPage]);

  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await blockSubjectService.getBlocks(currentPage);
      setBlocks(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError('Failed to load block subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await blockSubjectService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (identifier: string) => {
    if (!confirm('Are you sure you want to delete this block? All subjects in this block will be removed from the block.')) {
      return;
    }

    setDeletingId(identifier);
    try {
      await blockSubjectService.deleteBlock(identifier);
      fetchBlocks();
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting block:', err);
      alert(err.response?.data?.error || 'Failed to delete block');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuccess = () => {
    fetchBlocks();
    fetchStats();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Block Subjects</h1>
            <p className="text-gray-600 mt-1">
              Manage subjects that are taught in the same time slot
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Block
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200 transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Total Blocks</p>
                <p className="text-4xl font-bold mt-2 text-gray-900">{stats.total_blocks}</p>
                <p className="text-gray-500 text-xs mt-1">Active block groups</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200 transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium uppercase tracking-wide">Subjects in Blocks</p>
                <p className="text-4xl font-bold mt-2 text-gray-900">{stats.total_subjects_in_blocks}</p>
                <p className="text-gray-500 text-xs mt-1">Total grouped subjects</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : blocks.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-blue-200">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-md">
            <AlertCircle size={40} className="text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Block Subjects Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Block subjects allow you to group subjects that are taught in the same time slot. 
            For example, CRE and IRE can be grouped together.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 inline-flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus size={20} />
            Create Your First Block
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Block Subjects
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Subjects
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blocks.map((block, index) => (
                    <tr key={block.identifier} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                          {(currentPage - 1) * 20 + index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-3">
                          {block.subjects.map((subject, idx) => (
                            <React.Fragment key={subject.id}>
                              <span className="inline-block px-5 py-2.5 bg-white border-2 border-blue-500 text-blue-900 text-base font-bold rounded-lg shadow-md hover:bg-blue-50 transition-colors">
                                {subject.subject}
                              </span>
                              {idx < block.subjects.length - 1 && (
                                <span className="text-gray-600 font-bold text-lg self-center">|</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                          Block ID: {block.identifier.substring(0, 13)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-800 rounded-full font-bold text-lg">
                          {block.subject_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-700">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(block.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(block.identifier)}
                          disabled={deletingId === block.identifier}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150"
                          title="Delete block"
                        >
                          {deletingId === block.identifier ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                ← Previous
              </button>
              <div className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-md">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <AddBlockSubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default BlockSubjects;

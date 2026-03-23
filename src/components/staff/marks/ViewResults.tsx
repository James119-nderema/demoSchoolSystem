import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MarksAPI } from '../../../services/baseUrl';
import { getGradeColor } from '../../../utils/gradingUtils';
import { SkeletonTable } from '../../ui/Skeleton';
import LoadingProgress from '../../ui/LoadingProgress';
import { useProgressiveLoad, type PaginatedResponse } from '../../../hooks/useProgressiveLoad';

interface Result {
  id: number;
  student_name: string;
  student_admission_number: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  exam_type: string;
  term: string;
  academic_year: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  entered_by_name: string;
  date_created: string;
  date_updated: string;
}

interface EditModalProps {
  result: Result | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, newMarks: number) => void;
}

const EditModal: React.FC<EditModalProps> = ({ result, isOpen, onClose, onSave }) => {
  const [marks, setMarks] = useState<number>(result?.marks_obtained || 0);

  useEffect(() => {
    if (result) {
      setMarks(result.marks_obtained);
    }
  }, [result]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (result) {
      onSave(result.id, marks);
    }
    onClose();
  };

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Edit Student Marks</h2>
        
        {/* Student Info Card */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {result.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{result.student_name}</p>
              <p className="text-xs text-gray-500">{result.subject_name}</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Total Marks: <span className="font-medium">{result.total_marks}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marks Obtained
            </label>
            <input
              type="number"
              max={result.total_marks}
              min={0}
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className="w-full px-4 py-3 text-lg text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-indigo-600 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
}

interface Subject {
  id: number;
  subject_name: string;
  subject_code: string;
}

interface Statistics {
  total_results: number;
  average_percentage: number;
  grade_distribution: { [key: string]: number };
  subject_averages: { [key: string]: { average: number; count: number } };
  class_averages: { [key: string]: { average: number; count: number } };
}

const ViewResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Dropdown data
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Filters
  const selectedClassId = searchParams.get('class_id') || '';
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const selectedExamType = searchParams.get('exam_type') || '';
  const selectedTerm = searchParams.get('term') || '';
  const selectedAcademicYear = searchParams.get('academic_year') || '';
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('q') || '');
  
  // View state
  const [showStatistics, setShowStatistics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;

  // Progressive data loading – fetch page 1 fast, load rest in background
  const {
    data: results,
    loading,
    totalCount,
    loadedCount,
    progress,
    isComplete,
    refresh: refreshResults,
  } = useProgressiveLoad<Result>(
    async (page, pageSize) => {
      const data = await MarksAPI.getResults({ page: String(page), page_size: String(pageSize) });
      return data as PaginatedResponse<Result>;
    },
    [],
    { pageSize: 100 }
  );

  useEffect(() => {
    fetchDropdownData();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedClassId, selectedSubject, selectedExamType, selectedTerm, selectedAcademicYear, subjects]);

  useEffect(() => {
    applyFilters();
  }, [results, classes, selectedClassId, selectedSubject, selectedExamType, selectedTerm, selectedAcademicYear, searchTerm]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (selectedClassId) next.set('class_id', selectedClassId);
    if (selectedExamType) next.set('exam_type', selectedExamType);
    if (selectedTerm) next.set('term', selectedTerm);
    if (selectedAcademicYear) next.set('academic_year', selectedAcademicYear);
    if (selectedSubject) {
      const subjectObj = subjects.find((s) => s.subject_name === selectedSubject);
      if (subjectObj) next.set('subject_id', subjectObj.id.toString());
    }
    if (searchTerm) next.set('q', searchTerm);

    if (searchParams.toString() !== next.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    selectedClassId,
    selectedSubject,
    selectedExamType,
    selectedTerm,
    selectedAcademicYear,
    searchTerm,
    subjects,
    searchParams,
    setSearchParams,
  ]);

  const fetchDropdownData = async () => {
    try {
      const data = await MarksAPI.getDropdownData();
      setClasses(data.classes);
      setSubjects(data.subjects);

      const subjectIdFromQuery = searchParams.get('subject_id');
      if (subjectIdFromQuery) {
        const matchedSubject = data.subjects.find((s: Subject) => String(s.id) === subjectIdFromQuery);
        if (matchedSubject) setSelectedSubject(matchedSubject.subject_name);
      }

    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  const handleEditResult = async (id: number, newMarks: number) => {
    try {
      await MarksAPI.updateResult(id.toString(), { marks_obtained: newMarks });
      // Refresh results after update
      refreshResults();
      setError('');
    } catch (err) {
      setError('Failed to update marks');
    }
  };

  const fetchStatistics = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedClassId) params.class_id = selectedClassId;
      if (selectedSubject) {
        const subjectObj = subjects.find((s) => s.subject_name === selectedSubject);
        if (subjectObj) params.subject_id = subjectObj.id.toString();
      }
      if (selectedExamType) params.exam_type = selectedExamType;
      if (selectedTerm) params.term = selectedTerm;
      if (selectedAcademicYear) params.academic_year = selectedAcademicYear;

      const data = await MarksAPI.getStatistics(params);
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const applyFilters = () => {
    let filtered = results;

    if (selectedClassId) {
      const selectedClassObj = classes.find((cls) => cls.id.toString() === selectedClassId);
      if (selectedClassObj) {
        filtered = filtered.filter(result => result.class_name === selectedClassObj.class_name);
      }
    }

    if (selectedSubject) {
      filtered = filtered.filter(result => result.subject_name.includes(selectedSubject));
    }

    if (selectedExamType) {
      filtered = filtered.filter(result => result.exam_type === selectedExamType);
    }

    if (selectedTerm) {
      filtered = filtered.filter(result => result.term === selectedTerm);
    }

    if (selectedAcademicYear) {
      filtered = filtered.filter(result => result.academic_year === selectedAcademicYear);
    }

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student_admission_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResults(filtered);
    setCurrentPage(1);
  };

  const getExamTypeDisplay = (examType: string) => {
    const types: { [key: string]: string } = {
      'exam_1': 'Exam 1',
      'exam_2': 'Exam 2',
      'exam_3': 'Exam 3'
    };
    return types[examType] || examType;
  };

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = filteredResults.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Student Results</h1>
            <p className="mt-2 text-gray-600">View and manage examination results</p>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-pulse bg-gray-200 rounded-lg h-10 flex-1 max-w-sm" />
            <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-28" />
          </div>
          <SkeletonTable rows={8} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Results</h1>
              <p className="mt-2 text-gray-600">View and manage examination results</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowStatistics(!showStatistics)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (selectedClassId) params.set('class_id', selectedClassId);
                  if (selectedSubject) {
                    const subj = subjects.find(s => s.subject_name === selectedSubject);
                    if (subj) params.set('subject_id', subj.id.toString());
                  }
                  if (selectedExamType) params.set('exam_type', selectedExamType);
                  if (selectedTerm) params.set('term', selectedTerm);
                  if (selectedAcademicYear) params.set('academic_year', selectedAcademicYear);
                  navigate(`/edit-marks?${params.toString()}`);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Edit Marks
              </button>
              <button
                onClick={() => navigate('/input-marks')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Input Marks
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Statistics Panel */}
        {showStatistics && statistics && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistics Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-600">Total Results</div>
                <div className="text-2xl font-bold text-blue-900">{statistics.total_results}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-600">Average Percentage</div>
                <div className="text-2xl font-bold text-green-900">{statistics.average_percentage.toFixed(1)}%</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-600">Subjects Covered</div>
                <div className="text-2xl font-bold text-purple-900">{Object.keys(statistics.subject_averages).length}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-orange-600">Classes Covered</div>
                <div className="text-2xl font-bold text-orange-900">{Object.keys(statistics.class_averages).length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Grade Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(statistics.grade_distribution).map(([grade, count]) => (
                    <div key={grade} className="flex justify-between items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade)}`}>
                        {grade}
                      </span>
                      <span className="text-sm text-gray-600">{count} students</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Averages */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Subject Averages</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(statistics.subject_averages).map(([subject, data]) => (
                    <div key={subject} className="flex justify-between items-center">
                      <span className="text-sm text-gray-900">{subject}</span>
                      <span className="text-sm text-gray-600">{data.average}% ({data.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Search</h2>
            <button
              onClick={() => {
                setSearchTerm('');
              }}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Clear
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or admission no."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredResults.length} of {results.length} results
            {!isComplete && totalCount > 0 && ` (loading from ${totalCount.toLocaleString()} total)`}
          </div>
          <LoadingProgress
            loadedCount={loadedCount}
            totalCount={totalCount}
            progress={progress}
            isComplete={isComplete}
          />
        </div>

        {/* Results Table / Mobile Cards */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No results found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  currentResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.student_admission_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.subject_name}</div>
                        <div className="text-sm text-gray-500">{result.subject_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getExamTypeDisplay(result.exam_type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Term {result.term} • {result.academic_year}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.marks_obtained} / {result.total_marks}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.percentage.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(result.date_created).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedResult(result);
                            setIsEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {currentResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No results found. Try adjusting your filters.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {currentResults.map((result) => (
                  <div key={result.id} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Student Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {result.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {result.student_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {result.student_admission_number}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                    </div>

                    {/* Result Details */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">{result.subject_name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{result.subject_code}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-sm text-gray-700">{result.class_name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {getExamTypeDisplay(result.exam_type)} • Term {result.term}
                        </span>
                      </div>

                      {/* Marks Section */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500">Score</span>
                            <div className="text-lg font-bold text-gray-900">
                              {result.marks_obtained} <span className="text-sm font-normal text-gray-500">/ {result.total_marks}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">Percentage</span>
                            <div className="text-lg font-bold text-indigo-600">
                              {result.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(result.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(result.date_created).toLocaleDateString()}</span>
                        <span className="text-gray-300">•</span>
                        <span>{result.academic_year}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setIsEditModalOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            
          {/* Edit Modal */}
          <EditModal
            result={selectedResult}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedResult(null);
            }}
            onSave={handleEditResult}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredResults.length)}</span> of{' '}
                    <span className="font-medium">{filteredResults.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isActive
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewResults;

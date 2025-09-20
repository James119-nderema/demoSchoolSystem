import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DataAPI, MarksAPI } from '../../../services/baseUrl';

interface SubjectStatistics {
  subject_name: string;
  average_percentage: number;
  standard_deviation: number;
  highest_score: number;
  lowest_score: number;
  total_students: number;
  grade_distribution: Record<string, number>;
}

interface StreamComparison {
  stream: string;
  average_percentage: number;
  total_classes: number;
  classes: Array<{
    class_id: number;
    class_name: string;
    average_percentage: number;
    rank: number;
  }>;
}

interface ClassStatistics {
  class_id: number;
  class_name: string;
  stream: string;
  total_students: number;
  overall_average: number;
  class_rank_in_stream: number;
  subjects: SubjectStatistics[];
  stream_comparison: StreamComparison[];
  student_performance_distribution: Array<{
    percentage_range: string;
    student_count: number;
  }>;
  top_performers: Array<{
    student_id: number;
    student_name: string;
    average_percentage: number;
    rank: number;
  }>;
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
  stream: string;
  grade_level: string;
}

const ClassStatistics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [classData, setClassData] = useState<ClassStatistics | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(searchParams.get('class_id') || '');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState<string>('exam_1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [noDataResponse, setNoDataResponse] = useState<any>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStatistics();
    }
  }, [selectedClassId, selectedTerm, selectedAcademicYear, selectedExamType]);

  const fetchClasses = async () => {
    try {
      const data = await DataAPI.getClasses();
      setClasses(data.results || data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchClassStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoDataResponse(null);
      setError(null);
      
      const params = {
        class_id: selectedClassId,
        term: selectedTerm,
        academic_year: selectedAcademicYear,
        exam_type: selectedExamType
      };

      const data = await MarksAPI.getClassAnalytics(params);
      
      // Check if it's a "no data" response
      if (data.no_data) {
        setClassData(null);
        setError(null);
        setNoDataResponse(data);
        setLoading(false);
        return;
      }
      
      // Check if it's an error response
      if (data.error) {
        setError(data.message || data.error);
        setClassData(null);
        setNoDataResponse(null);
        setLoading(false);
        return;
      }
      
      setClassData(data);
      setError(null);
      setNoDataResponse(null);
    } catch (err) {
      console.error('Error fetching class statistics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setClassData(null);
      setNoDataResponse(null);
    } finally {
      setLoading(false);
    }
  };

  // const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Class Statistics</h1>
        
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const classId = e.target.value;
                setSelectedClassId(classId);
                setClassData(null);
                
                // Update URL parameters
                const newParams = new URLSearchParams(searchParams);
                if (classId) {
                  newParams.set('class_id', classId);
                } else {
                  newParams.delete('class_id');
                }
                setSearchParams(newParams);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id.toString()}>
                  {cls.class_name} - Stream {cls.stream}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term:
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year:
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Type:
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="exam_1">Exam 1</option>
              <option value="exam_2">Exam 2</option>
              <option value="exam_3">Exam 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={fetchClassStatistics}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* No Data Available Message */}
      {noDataResponse && !loading && !error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong className="text-lg font-semibold">No Data Available</strong>
          </div>
          <p className="text-sm mb-2">{noDataResponse.message}</p>
          <div className="bg-yellow-100 rounded p-3 mt-3">
            <p className="text-sm font-medium mb-1">Query Details:</p>
            <p className="text-sm">
              <strong>Class:</strong> {noDataResponse.class_name}
            </p>
            <p className="text-sm">
              <strong>Period:</strong> {noDataResponse.period_info?.term}, {noDataResponse.period_info?.academic_year}, {noDataResponse.period_info?.exam_type}
            </p>
          </div>
          <p className="text-xs mt-3 text-yellow-700">
            Try selecting a different term, academic year, or exam type to find available data.
          </p>
        </div>
      )}

      {/* No Selection Message */}
      {!classData && !loading && !error && !noDataResponse && !selectedClassId && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
          <strong className="font-bold">Select a class</strong>
          <p className="text-sm mt-1">Choose a class from the dropdown above to view detailed statistics.</p>
        </div>
      )}

      {/* Class Statistics Display */}
      {classData && !loading && (
        <>
          {/* Class Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">{classData.class_name}</h3>
                <p className="text-sm text-gray-600">{classData.stream} Stream</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-blue-600">Total Students</h4>
                <p className="text-2xl font-bold text-blue-900">{classData.total_students}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-green-600">Class Average</h4>
                <p className="text-2xl font-bold text-green-900">{classData.overall_average?.toFixed(1) ?? 'N/A'}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-purple-600">Stream Rank</h4>
                <p className="text-2xl font-bold text-purple-900">#{classData.class_rank_in_stream}</p>
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject Averages</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classData.subjects || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average_percentage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Standard Deviation by Subject</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classData.subjects || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="standard_deviation" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Performance Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classData.student_performance_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="percentage_range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="student_count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stream Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Stream Comparison</h2>
            {(classData.stream_comparison || []).map(stream => (
              <div key={stream.stream} className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-3">
                  {stream.stream} Stream (Average: {stream.average_percentage?.toFixed(1) ?? 'N/A'}%)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stream.classes.map((cls) => (
                        <tr 
                          key={cls.class_id} 
                          className={`hover:bg-gray-50 ${cls.class_id === classData.class_id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              cls.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                              cls.rank <= 3 ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              #{cls.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cls.class_name}
                            {cls.class_id === classData.class_id && (
                              <span className="ml-2 text-xs text-blue-600">(Current)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(cls.average_percentage || 0)}`}>
                              {cls.average_percentage?.toFixed(1) ?? 'N/A'}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(classData.top_performers || []).slice(0, 6).map((student, index) => (
                <div key={student.student_id} className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{student.student_name}</h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      #{student.rank}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">{student.average_percentage?.toFixed(1) ?? 'N/A'}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Subject Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Detailed Subject Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Std Dev
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Highest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lowest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(classData.subjects || []).map((subject, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subject.subject_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(subject.average_percentage || 0)}`}>
                          {subject.average_percentage?.toFixed(1) ?? 'N/A'}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject.standard_deviation?.toFixed(2) ?? 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject.highest_score?.toFixed(1) ?? 'N/A'}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject.lowest_score?.toFixed(1) ?? 'N/A'}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject.total_students}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* No Class Selected Message */}
      {!selectedClassId && !loading && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Class</h3>
          <p className="text-gray-500">Choose a class from the dropdown menu above to view detailed statistics.</p>
        </div>
      )}
    </div>
  );
};

export default ClassStatistics;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { authFetch } from '../../../utils/apiInterceptors';
import { generateReportsPDF } from '../../../utils/pdfGenerator';
import { getGrade as calculateGradeFromPercent, getGradeColor } from '../../../utils/gradingUtils';

export interface Student {
  student_name: string;
  average: number;
  total: number;
  stream: string;
  position: number;
}

export interface TopStudentsPerClass {
  class_name: string;
  stream: string;
  students: Student[];
}

export interface Champion {
  student_name: string;
  stream: string;
  marks: number;
  subject: string;
}

export interface SubjectChampionsPerClass {
  class_name: string;
  stream: string;
  champions: Champion[];
}

export interface StreamWithinClass {
  stream: string;
  class_name: string;
  average: number;
  position: number;
  total_students: number;
}

export interface StreamRanking {
  class_level: string;
  class_average: number;
  class_position: number;
  streams: StreamWithinClass[];
}

export interface PieChartData {
  stream: string;
  top_students: number;
  subject_champions: number;
  total_classes: number;
}

export interface ReportsData {
  top_students_per_class: TopStudentsPerClass[];
  subject_champions: SubjectChampionsPerClass[];
  stream_rankings: StreamRanking[];
  pie_chart_data: PieChartData[];
  message?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ReportsDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noDataResponse, setNoDataResponse] = useState(false);

  // Filter states
  const [term, setTerm] = useState(searchParams.get('term') || '');
  const [academicYear, setAcademicYear] = useState(searchParams.get('academic_year') || '');
  const [examType, setExamType] = useState(searchParams.get('exam_type') || '');

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoDataResponse(false);

      const params = new URLSearchParams();
      if (term) params.append('term', term);
      if (academicYear) params.append('academic_year', academicYear);
      if (examType) params.append('exam_type', examType);

      console.log('Fetching reports data with params:', params.toString());
      const response = await authFetch(`/api/input-marks/reports-data/?${params.toString()}`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch reports data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.message) {
        setNoDataResponse(true);
        setReportsData(data);
      } else {
        setReportsData(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when filters change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReportsData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [term, academicYear, examType]);

  const handleFilterChange = (filterType: string, value: string) => {
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (value) {
      newSearchParams.set(filterType, value);
    } else {
      newSearchParams.delete(filterType);
    }
    
    setSearchParams(newSearchParams);
    
    // Update state - will trigger useEffect to fetch data
    switch (filterType) {
      case 'term':
        setTerm(value);
        break;
      case 'academic_year':
        setAcademicYear(value);
        break;
      case 'exam_type':
        setExamType(value);
        break;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Reports</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (noDataResponse) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
          <button
            onClick={() => {
              if (reportsData) {
                generateReportsPDF(reportsData, {
                  term,
                  academicYear,
                  examType
                });
              }
            }}
            disabled={!reportsData || loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            {loading ? 'Loading...' : 'Download PDF Report'}
          </button>
        </div>
        
        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select
                value={term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Terms</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => handleFilterChange('exam_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Exam Types</option>
                <option value="exam_1">Exam 1</option>
                <option value="exam_2">Exam 2</option>
                <option value="exam_3">Exam 3</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <svg className="h-12 w-12 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-blue-900 mb-2">No Reports Data Available</h3>
            <p className="text-blue-700">
              {reportsData?.message || 'No data available for the selected filters. Try adjusting your filter criteria.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare pie chart data (only when data exists)
  let topStudentsPieData: Array<{name: string, value: number, fill: string}> = [];
  let championsPieData: Array<{name: string, value: number, fill: string}> = [];
  
  if (reportsData?.pie_chart_data && Array.isArray(reportsData.pie_chart_data)) {
    topStudentsPieData = reportsData.pie_chart_data
      .filter(item => item.top_students > 0)
      .map((item, index) => ({
        name: item.stream,
        value: item.top_students,
        fill: COLORS[index % COLORS.length]
      }));

    championsPieData = reportsData.pie_chart_data
      .filter(item => item.subject_champions > 0)
      .map((item, index) => ({
        name: item.stream,
        value: item.subject_champions,
        fill: COLORS[index % COLORS.length]
      }));
  }

  // Debug logging
  console.log('Reports Data:', reportsData);
  console.log('Pie Chart Data Raw:', reportsData?.pie_chart_data);
  console.log('Top Students Pie Data:', topStudentsPieData);
  console.log('Champions Pie Data:', championsPieData);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <button
          onClick={() => {
            if (reportsData) {
              generateReportsPDF(reportsData, {
                term,
                academicYear,
                examType
              });
            }
          }}
          disabled={!reportsData || loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
          {loading ? 'Loading...' : 'Download PDF Report'}
        </button>
      </div>
      
      {/* Filter Controls - Always visible */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select
              value={term}
              onChange={(e) => handleFilterChange('term', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Terms</option>
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => handleFilterChange('academic_year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => handleFilterChange('exam_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Exam Types</option>
              <option value="exam_1">Exam 1</option>
              <option value="exam_2">Exam 2</option>
              <option value="exam_3">Exam 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Students by Stream
            {loading && <span className="ml-2 text-sm text-gray-500">(Updating...)</span>}
          </h2>
          {topStudentsPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topStudentsPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topStudentsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading chart data...</p>
                  </>
                ) : (
                  <>
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-600">No data available for chart</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Subject Champions by Stream
            {loading && <span className="ml-2 text-sm text-gray-500">(Updating...)</span>}
          </h2>
          {championsPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={championsPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {championsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading chart data...</p>
                  </>
                ) : (
                  <>
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-600">No data available for chart</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Students Per Class */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Students Per Class</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading students data...</p>
            </div>
          </div>
        ) : (
          reportsData?.top_students_per_class.map((classData, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-3">
              {classData.class_name} ({classData.stream} Stream)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stream
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classData.students.map((student, studentIndex) => (
                    <tr key={studentIndex} className={studentIndex === 0 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.position === 1 && '🥇'} 
                        {student.position === 2 && '🥈'} 
                        {student.position === 3 && '🥉'} 
                        {student.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.average ? student.average.toFixed(2) : '0.00'}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.stream}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Subject Champions Per Class */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Champions Per Class</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading champions data...</p>
            </div>
          </div>
        ) : (
          reportsData?.subject_champions.map((classData, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-3">
              {classData.class_name} ({classData.stream} Stream)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stream
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classData.champions.map((champion, championIndex) => (
                    <tr key={championIndex}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        🏆 {champion.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {champion.stream}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {champion.marks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {champion.subject}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Stream Rankings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stream Rankings</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading rankings data...</p>
            </div>
          </div>
        ) : (
          reportsData?.stream_rankings?.map((classData, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                {classData.class_level} (Position: #{classData.class_position})
                <span className="ml-2 text-sm text-gray-600">
                  Class Average: {classData.class_average ? classData.class_average.toFixed(2) : '0.00'}%
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stream Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class & Stream
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stream
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classData.streams?.map((streamRank, streamIndex) => {
                      const gradeForAverage = calculateGradeFromPercent(streamRank.average || 0);

                      return (
                        <tr key={streamIndex} className={streamIndex === 0 ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {streamRank.position === 1 && '🥇'} 
                            {streamRank.position === 2 && '🥈'} 
                            {streamRank.position === 3 && '🥉'} 
                            #{streamRank.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {streamRank.class_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {streamRank.stream}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {streamRank.average ? streamRank.average.toFixed(2) : '0.00'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {streamRank.total_students || 0} students
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(gradeForAverage)}`}>
                              {gradeForAverage}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;

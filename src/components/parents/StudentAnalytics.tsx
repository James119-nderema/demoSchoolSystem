import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ParentsAPI } from '../../services/baseUrl';
import { getGradeColorFromMarks } from '../../utils/gradingUtils';
import { SkeletonCards, SkeletonChart } from '../ui/Skeleton';

interface StudentInfo {
  name: string;
  admission_number: string;
  class: string;
  school: string;
}

interface OverallPerformance {
  total_marks: number;
  total_subjects: number;
  average_marks: number;
  class_position: number | null;
  class_size: number;
  percentile: number | null;
}

interface SubjectPerformance {
  subject: string;
  marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
}

interface SubjectComparison {
  subject: string;
  student_marks: number;
  class_average: number;
  difference: number;
  above_average: boolean;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterOptionsData {
  academic_years: FilterOption[];
  terms: FilterOption[];
  exam_types: FilterOption[];
  subjects: FilterOption[];
}

interface AnalyticsData {
  student_info: StudentInfo;
  overall_performance: OverallPerformance;
  subject_performance: SubjectPerformance[];
  best_subject: SubjectPerformance | null;
  worst_subject: SubjectPerformance | null;
  subject_comparison: SubjectComparison[];
  performance_trend: any[];
  class_statistics: {
    class_name: string;
    total_students: number;
    class_average: number;
  };
  filter_options: FilterOptionsData;
}

interface StudentAnalyticsProps {
  onBack?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface FilterOptions {
  term: string;
  examType: string;
  academicYear: string;
  subject: string;
}

export default function StudentAnalytics({ onBack }: StudentAnalyticsProps) {
  const [searchParams] = useSearchParams();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const urlTerm = searchParams.get('term') || 'all';
  const urlExamType = searchParams.get('exam_type') || 'all';
  const urlAcademicYear = searchParams.get('academic_year') || 'all';

  const [filters, setFilters] = useState<FilterOptions>({
    term: urlTerm,
    examType: urlExamType,
    academicYear: urlAcademicYear,
    subject: 'all'
  });

  useEffect(() => {
    setFilters((prev) => {
      const next: FilterOptions = {
        ...prev,
        term: urlTerm,
        examType: urlExamType,
        academicYear: urlAcademicYear,
      };

      if (
        prev.term === next.term &&
        prev.examType === next.examType &&
        prev.academicYear === next.academicYear
      ) {
        return prev;
      }

      return next;
    });
  }, [urlTerm, urlExamType, urlAcademicYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters from filters
      const params: Record<string, string> = {};
      if (filters.academicYear !== 'all') {
        params.academic_year = filters.academicYear;
      }
      if (filters.term !== 'all') {
        params.term = filters.term;
      }
      if (filters.examType !== 'all') {
        params.exam_type = filters.examType;
      }
      if (filters.subject !== 'all') {
        params.subject = filters.subject;
      }

      const data = await ParentsAPI.getStudentAnalytics(params);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const filterSubjectPerformance = () => analyticsData?.subject_performance || [];



  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Use centralized grading utility
  const getGradeColor = (marks: number) => {
    return getGradeColorFromMarks(marks);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Student Analysis & Statistics</h1>
            <p className="text-gray-600 mt-2">Comprehensive academic performance analysis</p>
          </div>
          <SkeletonCards count={4} className="mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-yellow-800 font-medium">No Data Available</h3>
            </div>
            <p className="text-yellow-700 mt-2">No analytics data found for this student.</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredSubjects = filterSubjectPerformance();
  const pieChartData = filteredSubjects?.map((subject, index) => ({
    name: subject.subject,
    value: subject.marks,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Analysis & Statistics</h1>
              <p className="text-gray-600 mt-2">Comprehensive academic performance analysis</p>
              <p className="text-xs text-gray-500 mt-2">
                Period: {filters.term !== 'all' ? `Term ${filters.term}` : 'All Terms'} • {filters.examType !== 'all' ? filters.examType : 'All Exams'} • {filters.academicYear !== 'all' ? filters.academicYear : 'All Years'}
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{analyticsData?.student_info?.name || 'Student'}</h2>
              <p className="text-gray-600">Admission Number: {analyticsData?.student_info?.admission_number || 'N/A'}</p>
              <p className="text-gray-600">Class: {analyticsData?.student_info?.class || 'N/A'}</p>
              <p className="text-gray-600">School: {analyticsData?.student_info?.school || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Marks</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overall_performance?.average_marks || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Class Position</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.overall_performance?.class_position || 'N/A'}
                  {analyticsData?.overall_performance?.class_size && (
                    <span className="text-sm text-gray-500">/{analyticsData?.overall_performance?.class_size}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overall_performance?.total_subjects || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Percentile</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.overall_performance?.percentile ? `${analyticsData?.overall_performance?.percentile}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Performance Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Comparison Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance vs Class Average</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.subject_comparison || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="subject" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="student_marks" fill="#3B82F6" name="Student Marks" />
                  <Bar dataKey="class_average" fill="#EF4444" name="Class Average" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subject Performance Table */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Subject Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Average</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects?.map((subject, index) => {
                  const comparison = analyticsData?.subject_comparison?.find(c => c.subject === subject.subject);
                  return (
                    <tr key={`${subject.subject}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subject.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.marks}/{subject.max_marks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getPerformanceColor(subject.percentage)}`}>
                          {subject.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(subject.marks)}`}>
                          {subject.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comparison?.class_average || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {comparison && (
                          <span className={`font-medium ${comparison.above_average ? 'text-green-600' : 'text-red-600'}`}>
                            {comparison.above_average ? '+' : ''}{comparison.difference.toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best and Worst Subjects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyticsData?.best_subject && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Best Subject</h3>
                  <p className="text-sm text-gray-600">Highest scoring subject</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold text-green-600">{analyticsData?.best_subject?.subject || 'N/A'}</p>
                <p className="text-lg text-gray-900">{analyticsData?.best_subject?.marks || 0}/{analyticsData?.best_subject?.max_marks || 0} ({(analyticsData?.best_subject?.percentage || 0).toFixed(1)}%)</p>
              </div>
            </div>
          )}

          {analyticsData?.worst_subject && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Needs Improvement</h3>
                  <p className="text-sm text-gray-600">Subject requiring more focus</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold text-red-600">{analyticsData?.worst_subject?.subject || 'N/A'}</p>
                <p className="text-lg text-gray-900">{analyticsData?.worst_subject?.marks || 0}/{analyticsData?.worst_subject?.max_marks || 0} ({(analyticsData?.worst_subject?.percentage || 0).toFixed(1)}%)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link} from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { MarksAPI } from '../../../services/baseUrl';
import { BookOpen, TrendingUp, Award, AlertCircle, Target, Users, Filter, RefreshCw } from 'lucide-react';

interface AvailableFilters {
  terms: string[];
  academic_years: string[];
  exam_types: string[];
}


interface SubjectAnalyticsData {
  subject_info: {
    name: string;
    code: string;
    academic_year: string;
  };
  overall_average: number;
  total_assessments: number;
  total_students_assessed: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  excellence_rate: number;
  class_performance: Record<string, {
    average: number;
    assessments: number;
    pass_rate: number;
  }>;
  performance_trends: Record<string, {
    average: number;
    count: number;
  }>;
  challenging_topics: string[];
  success_areas: string[];
  grade_distribution: Record<string, number>;
  available_filters?: AvailableFilters;
  current_filters?: {
    term: string;
    academic_year: string;
    exam_type: string;
  };
}

interface SubjectAnalyticsProps {
  subjectId: string;
  onBack?: () => void;
  onClassClick?: (classId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SubjectAnalytics: React.FC<SubjectAnalyticsProps> = ({ 
  subjectId, 

  onClassClick 
}) => {
  const [subjectData, setSubjectData] = useState<SubjectAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    terms: [],
    academic_years: [],
    exam_types: []
  });

  const EXAM_TYPE_LABELS: Record<string, string> = {
    'exam_1': 'Exam 1',
    'exam_2': 'Exam 2',
    'exam_3': 'Exam 3',
    'cat_1': 'CAT 1',
    'cat_2': 'CAT 2',
    'cat_3': 'CAT 3',
    'midterm': 'Mid-Term',
    'endterm': 'End-Term',
    'final': 'Final Exam'
  };

  const fetchSubjectData = async (useFilters = false) => {
    try {
      setLoading(true);
      console.log('Fetching data for subject ID:', subjectId);
      
      const params: Record<string, string> = {
        subject_id: subjectId
      };
      
      // Only add filters if explicitly requested (after initial load)
      if (useFilters) {
        if (selectedTerm) params.term = selectedTerm;
        if (selectedExamType) params.exam_type = selectedExamType;
        if (selectedAcademicYear) params.academic_year = selectedAcademicYear;
      }
      
      const response = await MarksAPI.get('/api/input-marks/subject-analytics/', {
        params
      });
      
      if (!response) {
        throw new Error('No response from API');
      }

      // Check if data is in response or response.data
      const data = response.data || response;
      
      console.log('API Response:', data);
      
      if (!data) {
        throw new Error('No data available in response');
      }

      // Update available filters from response
      if (data.available_filters) {
        setAvailableFilters(data.available_filters);
      }
      
      // Set current filter values from response (what the backend actually used)
      if (data.filters) {
        if (!selectedTerm && data.filters.term) setSelectedTerm(data.filters.term);
        if (!selectedExamType && data.filters.exam_type) setSelectedExamType(data.filters.exam_type);
        if (!selectedAcademicYear && data.filters.academic_year) setSelectedAcademicYear(data.filters.academic_year);
      }

      // Transform the backend response to match our frontend data structure
      const transformedData: SubjectAnalyticsData = {
        subject_info: {
          name: data.subject_info?.subject_name || data.subject_info?.name || 'Unknown Subject',
          code: data.subject_info?.subject_code || data.subject_info?.code || 'N/A',
          academic_year: data.filters?.academic_year || data.academic_year || '2024-2025'
        },
        overall_average: Number(data.statistics?.average_marks) || 0,
        total_assessments: Number(data.statistics?.total_assessments || data.statistics?.total_students) || 0,
        total_students_assessed: Number(data.statistics?.total_students) || 0,
        highest_score: Number(data.statistics?.highest_marks || data.statistics?.highest_score) || 0,
        lowest_score: Number(data.statistics?.lowest_marks || data.statistics?.lowest_score) || 0,
        pass_rate: Number(data.statistics?.pass_rate) || 0,
        excellence_rate: Number(data.statistics?.excellence_rate) || 0,
        class_performance: Object.entries(data.class_performance || {}).reduce((acc, [key, value]) => {
          const classData = value as any;
          acc[key] = {
            average: classData?.average || 0,
            assessments: classData?.student_count || classData?.assessments || 0,
            pass_rate: classData?.pass_rate || 0
          };
          return acc;
        }, {} as Record<string, { average: number; assessments: number; pass_rate: number }>),
        performance_trends: Object.entries(data.performance_trends || {}).reduce((acc, [key, value]) => {
          const trendData = value as any;
          acc[key] = {
            average: trendData?.average || 0,
            count: trendData?.count || 0
          };
          return acc;
        }, {} as Record<string, { average: number; count: number }>),
        challenging_topics: Array.isArray(data.challenging_topics) ? data.challenging_topics : [],
        success_areas: Array.isArray(data.success_areas) ? data.success_areas : [],
        grade_distribution: data.grade_distribution || {},
        available_filters: data.available_filters,
        current_filters: data.filters ? {
          term: data.filters.term,
          academic_year: data.filters.academic_year,
          exam_type: data.filters.exam_type
        } : undefined
      };

      console.log('Transformed data:', transformedData);
      setSubjectData(transformedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching subject analytics:', err);
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to fetch subject analytics');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch without filters (let backend use latest results)
  useEffect(() => {
    if (subjectId) {
      fetchSubjectData(false);
    }
  }, [subjectId]);
  
  // Refetch when filters change
  const handleApplyFilters = () => {
    fetchSubjectData(true);
  };

  const formatClassPerformanceData = () => {
    if (!subjectData?.class_performance) return [];
    
    try {
      return Object.entries(subjectData.class_performance).map(([className, data]) => ({
        class: className,
        average: Math.round((data.average || 0) * 100) / 100,
        assessments: data.assessments || 0,
        passRate: Math.round((data.pass_rate || 0) * 100) / 100
      }));
    } catch (err) {
      console.error('Error formatting class performance data:', err);
      return [];
    }
  };

  const formatTrendsData = () => {
    if (!subjectData?.performance_trends) return [];
    
    try {
      return Object.entries(subjectData.performance_trends)
        .map(([month, data]) => ({
          month,
          average: Math.round((data.average || 0) * 100) / 100,
          assessments: data.count || 0
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (err) {
      console.error('Error formatting trends data:', err);
      return [];
    }
  };

  const formatGradeDistribution = () => {
    if (!subjectData?.grade_distribution) return [];
    
    try {
      return Object.entries(subjectData.grade_distribution).map(([grade, count]) => ({
        grade,
        count: count || 0,
        percentage: Math.round(((count || 0) / (subjectData?.total_assessments || 1)) * 100)
      }));
    } catch (err) {
      console.error('Error formatting grade distribution data:', err);
      return [];
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 60) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-2">Loading subject analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Subject Analytics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={() => fetchSubjectData(false)}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!subjectData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No data available. </strong>
          <span className="block sm:inline">There is no analytics data available for this subject.</span>
        </div>
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel(subjectData.overall_average);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/staff/statistics/subjects"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Subjects
          </Link>
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subjectData?.subject_info?.name || 'Subject'}</h1>
              <p className="text-gray-600">
                Code: {subjectData?.subject_info?.code || 'N/A'} | {subjectData?.subject_info?.academic_year || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg ${performanceLevel.bgColor}`}>
          <p className={`font-medium ${performanceLevel.color}`}>
            {performanceLevel.label}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            {/* Term Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableFilters.terms.length > 0 ? (
                  availableFilters.terms.map(term => (
                    <option key={term} value={term}>Term {term}</option>
                  ))
                ) : (
                  <>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Exam Type Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Exam Type</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableFilters.exam_types.length > 0 ? (
                  availableFilters.exam_types.map(examType => (
                    <option key={examType} value={examType}>
                      {EXAM_TYPE_LABELS[examType] || examType}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="exam_1">Exam 1</option>
                    <option value="exam_2">Exam 2</option>
                    <option value="exam_3">Exam 3</option>
                    <option value="cat_1">CAT 1</option>
                    <option value="cat_2">CAT 2</option>
                    <option value="midterm">Mid-Term</option>
                    <option value="endterm">End-Term</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Academic Year Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableFilters.academic_years.length > 0 ? (
                  availableFilters.academic_years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  <>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Apply Filters Button */}
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors mt-5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Apply
            </button>
            
            {/* Current filter display */}
            {subjectData?.current_filters && (
              <div className="ml-auto text-sm text-gray-500">
                Showing: Term {subjectData.current_filters.term} | {EXAM_TYPE_LABELS[subjectData.current_filters.exam_type] || subjectData.current_filters.exam_type} | {subjectData.current_filters.academic_year}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Average</p>
                <p className="text-2xl font-bold text-gray-900">{subjectData?.overall_average?.toFixed(1) || '0'}%</p>
              </div>
              <Award className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{subjectData?.pass_rate?.toFixed(1) || '0'}%</p>
              </div>
              <Target className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Excellence Rate</p>
                <p className="text-2xl font-bold text-gray-900">{subjectData?.excellence_rate?.toFixed(1) || '0'}%</p>
              </div>
              <Award className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students Assessed</p>
                <p className="text-2xl font-bold text-gray-900">{subjectData?.total_students_assessed || 0}</p>
              </div>
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900">{subjectData?.highest_score?.toFixed(1) || '0'}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{subjectData?.total_assessments || 0}</p>
              </div>
              <BookOpen className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatClassPerformanceData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#8884d8" name="Average Score" />
                <Bar dataKey="passRate" fill="#82ca9d" name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={formatTrendsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Average Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatGradeDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.grade}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {formatGradeDistribution().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{subjectData.pass_rate}%</p>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{((100 - (subjectData.pass_rate || 0))).toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Fail Rate</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Performance Range</h4>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{subjectData.lowest_score}%</p>
                    <p className="text-xs text-gray-600">Lowest</p>
                  </div>
                  <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded"></div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{subjectData.highest_score}%</p>
                    <p className="text-xs text-gray-600">Highest</p>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-600">
                    Range: {((subjectData.highest_score || 0) - (subjectData.lowest_score || 0)).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Class Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formatClassPerformanceData().map((classData) => (
              <div 
                key={classData.class}
                className={`p-4 border rounded-lg ${
                  onClassClick ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${
                  classData.average >= subjectData.overall_average ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => onClassClick && onClassClick(classData.class)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{classData.class}</h4>
                  <div className={`px-2 py-1 rounded text-xs ${
                    classData.average >= subjectData.overall_average 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {classData.average >= subjectData.overall_average ? 'Above Avg' : 'Below Avg'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average:</span>
                    <span className="font-medium">{classData.average}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pass Rate:</span>
                    <span className="font-medium">{classData.passRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assessments:</span>
                    <span className="font-medium">{classData.assessments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Success Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(subjectData.success_areas || []).length > 0 ? (
                (subjectData.success_areas || []).map((area, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Award className="h-5 w-5 text-green-500 mr-3" />
                    <p className="text-gray-700">{area}</p>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Working to identify success patterns</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Areas Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle>Areas Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(subjectData.challenging_topics || []).length > 0 ? (
                (subjectData.challenging_topics || []).map((topic, index) => (
                  <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-gray-700">{topic}</p>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500">
                  <Award className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>All areas performing well!</p>
                </div>
              )}
              
              {subjectData.challenging_topics.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">Recommendations</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Provide additional resources for challenging topics</li>
                    <li>• Implement targeted remedial sessions</li>
                    <li>• Consider alternative teaching methods</li>
                    <li>• Increase practice exercises for difficult concepts</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubjectAnalytics;

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { MarksAPI } from '../../../services/baseUrl';
import { BookOpen, TrendingUp, Award, AlertCircle, Target, Users } from 'lucide-react';
import { SkeletonCards, SkeletonChart } from '../../ui/Skeleton';

interface AvailableFilters {
  terms: string[];
  academic_years: string[];
  exam_types: string[];
}

interface PerformanceTrendPoint {
  term: string;
  term_label: string;
  exam_type: string;
  exam_type_label: string;
  label: string;
  average: number;
  count: number;
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
  performance_trend_points?: PerformanceTrendPoint[];
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

const SubjectAnalytics: React.FC<SubjectAnalyticsProps> = ({ 
  subjectId, 
}) => {
  const [searchParams] = useSearchParams();
  const [subjectData, setSubjectData] = useState<SubjectAnalyticsData | null>(null);
  const [yearlyTrends, setYearlyTrends] = useState<Record<string, { average: number; count: number }>>({});
  const [yearlyTrendPoints, setYearlyTrendPoints] = useState<PerformanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryTerm = searchParams.get('term') || '';
  const queryExamType = searchParams.get('exam_type') || '';
  const queryAcademicYear = searchParams.get('academic_year') || '';
  const queryClassId = searchParams.get('class_id') || '';
  
  // Filter states
  const [selectedTerm, setSelectedTerm] = useState<string>(queryTerm);
  const [selectedExamType, setSelectedExamType] = useState<string>(queryExamType);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(queryAcademicYear);
  const selectedClassId = queryClassId;

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

  const fetchSubjectData = async (
    useFilters = false,
    overrides?: { term?: string; academic_year?: string; exam_type?: string; class_id?: string }
  ) => {
    try {
      setLoading(true);
      console.log('Fetching data for subject ID:', subjectId);
      
      const params: Record<string, string> = {
        subject_id: subjectId
      };
      
      // Only add filters if explicitly requested (after initial load)
      if (useFilters) {
        const finalTerm = overrides?.term ?? selectedTerm;
        const finalExamType = overrides?.exam_type ?? selectedExamType;
        const finalAcademicYear = overrides?.academic_year ?? selectedAcademicYear;
        const finalClassId = overrides?.class_id ?? selectedClassId;

        if (finalTerm) params.term = finalTerm;
        if (finalExamType) params.exam_type = finalExamType;
        if (finalAcademicYear) params.academic_year = finalAcademicYear;
        if (finalClassId) params.class_id = finalClassId;
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

      // Set current filter values from response (what the backend actually used)
      if (data.filters) {
        if (!selectedTerm && data.filters.term) setSelectedTerm(data.filters.term);
        if (!selectedExamType && data.filters.exam_type) setSelectedExamType(data.filters.exam_type);
        if (!selectedAcademicYear && data.filters.academic_year) setSelectedAcademicYear(data.filters.academic_year);
      }

      // Transform the backend response to match our frontend data structure
      const transformedPerformanceTrends = Object.entries(data.performance_trends || {}).reduce((acc, [key, value]) => {
        const trendData = value as any;
        acc[key] = {
          average: trendData?.average || 0,
          count: trendData?.count || 0
        };
        return acc;
      }, {} as Record<string, { average: number; count: number }>);

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
        performance_trends: transformedPerformanceTrends,
        performance_trend_points: Array.isArray(data.performance_trend_points)
          ? data.performance_trend_points
          : [],
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

      // Fetch trend data for the whole academic year (without term/exam filters)
      try {
        const yearlyTrendParams: Record<string, string> = {
          subject_id: subjectId,
        };
        const trendYear = overrides?.academic_year ?? selectedAcademicYear;
        const trendClassId = overrides?.class_id ?? selectedClassId;
        if (trendYear) yearlyTrendParams.academic_year = trendYear;
        if (trendClassId) yearlyTrendParams.class_id = trendClassId;

        const yearlyTrendResponse = await MarksAPI.get('/api/input-marks/subject-analytics/', {
          params: yearlyTrendParams,
        });
        const yearlyTrendData = yearlyTrendResponse.data || yearlyTrendResponse;
        const transformedYearlyTrends = Object.entries(yearlyTrendData?.performance_trends || {}).reduce((acc, [key, value]) => {
          const trendData = value as any;
          acc[key] = {
            average: trendData?.average || 0,
            count: trendData?.count || 0,
          };
          return acc;
        }, {} as Record<string, { average: number; count: number }>);
        setYearlyTrends(transformedYearlyTrends);
        setYearlyTrendPoints(
          Array.isArray(yearlyTrendData?.performance_trend_points)
            ? yearlyTrendData.performance_trend_points
            : []
        );
      } catch {
        setYearlyTrends(transformedPerformanceTrends);
        setYearlyTrendPoints(
          Array.isArray(transformedData.performance_trend_points)
            ? transformedData.performance_trend_points
            : []
        );
      }

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
      const hasRouteFilters = !!(queryTerm || queryExamType || queryAcademicYear || queryClassId);
      fetchSubjectData(hasRouteFilters, {
        term: queryTerm || undefined,
        exam_type: queryExamType || undefined,
        academic_year: queryAcademicYear || undefined,
        class_id: queryClassId || undefined,
      });
    }
  }, [subjectId, queryTerm, queryExamType, queryAcademicYear, queryClassId]);
  
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

  const formatYearlyTrendsData = () => {
    const trendPointSource = yearlyTrendPoints.length > 0
      ? yearlyTrendPoints
      : (subjectData?.performance_trend_points || []);

    if (trendPointSource.length > 0) {
      return trendPointSource.map((point) => ({
        period: point.label || `${point.term_label || `Term ${point.term}`} • ${point.exam_type_label || EXAM_TYPE_LABELS[point.exam_type] || point.exam_type}`,
        average: Math.round((point.average || 0) * 100) / 100,
        assessments: point.count || 0,
      }));
    }

    const trendSource = Object.keys(yearlyTrends || {}).length > 0
      ? yearlyTrends
      : (subjectData?.performance_trends || {});

    if (!trendSource || Object.keys(trendSource).length === 0) return [];
    
    try {
      const monthIndexMap: Record<string, number> = {
        jan: 1, january: 1,
        feb: 2, february: 2,
        mar: 3, march: 3,
        apr: 4, april: 4,
        may: 5,
        jun: 6, june: 6,
        jul: 7, july: 7,
        aug: 8, august: 8,
        sep: 9, sept: 9, september: 9,
        oct: 10, october: 10,
        nov: 11, november: 11,
        dec: 12, december: 12,
      };

      const resolveSortOrder = (monthKey: string) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(monthKey)) {
          return Number(monthKey.slice(0, 7).replace('-', ''));
        }

        if (/^\d{4}-\d{2}$/.test(monthKey)) {
          return Number(monthKey.replace('-', ''));
        }

        const yearMonthMatch = monthKey.match(/(\d{4})[-/](\d{1,2})/);
        if (yearMonthMatch) {
          const year = Number(yearMonthMatch[1]);
          const month = Number(yearMonthMatch[2]);
          return (year * 100) + month;
        }

        const normalized = monthKey.trim().toLowerCase();
        if (monthIndexMap[normalized]) return monthIndexMap[normalized];

        const leadingWord = normalized.split(/\s+/)[0];
        if (monthIndexMap[leadingWord]) return monthIndexMap[leadingWord];

        const quarterMatch = normalized.match(/q([1-4])/);
        if (quarterMatch) return Number(quarterMatch[1]) * 3;

        return Number.MAX_SAFE_INTEGER;
      };

      return Object.entries(trendSource)
        .map(([month, data]) => ({
          period: month,
          average: Math.round((data.average || 0) * 100) / 100,
          assessments: data.count || 0
        }))
        .sort((a, b) => resolveSortOrder(a.period) - resolveSortOrder(b.period));
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
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse bg-gray-200 rounded-full h-8 w-8" />
          <div>
            <div className="animate-pulse bg-gray-200 rounded h-7 w-48 mb-2" />
            <div className="animate-pulse bg-gray-200 rounded h-4 w-64" />
          </div>
        </div>
        <SkeletonCards count={4} />
        <SkeletonChart height="h-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
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
  const classPerformanceData = formatClassPerformanceData();
  const yearlyTrendData = formatYearlyTrendsData();
  const gradeDistributionData = formatGradeDistribution();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/statistics/subjects"
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

      {subjectData?.current_filters && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">
              Showing: Term {subjectData.current_filters.term} | {EXAM_TYPE_LABELS[subjectData.current_filters.exam_type] || subjectData.current_filters.exam_type} | {subjectData.current_filters.academic_year}
            </div>
          </CardContent>
        </Card>
      )}

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
              <BarChart data={classPerformanceData}>
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

        {/* Yearly Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance Trend (Year)</CardTitle>
          </CardHeader>
          <CardContent>
            {yearlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#8884d8"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Average Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
                No yearly trend data available for this subject yet.
              </div>
            )}
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
            {gradeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366F1" name="Students" />
                  <Bar dataKey="percentage" fill="#10B981" name="Percentage" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
                No grade distribution data available.
              </div>
            )}
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

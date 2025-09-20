import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, Award, AlertTriangle } from 'lucide-react';
import { MarksAPI } from '../services/baseUrl';

interface DashboardSummaryData {
  total_students: number;
  total_assessments: number;
  overall_average: number;
  improvement_trend: string;
  grade_distribution: Record<string, number>;
  performance_categories: Record<string, number>;
  top_students: Array<{ full_name: string; student_id: string; avg_score: number }>;
  top_classes: Array<{ class_name: string; grade_level: string; avg_score: number }>;
  top_subjects: Array<{ subject_name: string; subject_code: string; avg_score: number }>;
  at_risk_students: Array<{ full_name: string; student_id: string; avg_score: number }>;
  challenging_subjects: Array<{ subject_name: string; subject_code: string; avg_score: number }>;
  monthly_trends: Array<{ month: string; average: number; count: number }>;
  subject_comparison: Record<string, number>;
  class_comparison: Record<string, number>;
  last_updated: string;
  data_freshness: string;
}

interface PerformanceMetricsData {
  trend_data: {
    monthly: Array<{ month: string; average: number }>;
  };
  grade_distribution: Record<string, number>;
  performance_categories: Record<string, number>;
  subject_comparison: Record<string, number>;
  class_comparison: Record<string, number>;
  descriptive_stats: {
    total_assessments: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
  };
}

interface ComparativeAnalysisData {
  class_comparison: Record<string, { average: number; students: number }>;
  subject_comparison: Record<string, { average: number; assessments: number }>;
  year_over_year: {
    current_year: { year: number; average: number };
    previous_year: { year: number; average: number };
    improvement: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const StatisticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [metricsData, setMetricsData] = useState<PerformanceMetricsData | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff_access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch dashboard summary
      const dashboard = await MarksAPI.getDashboardSummary();
      
      // Fetch performance metrics
      const metrics = await MarksAPI.getPerformanceMetrics();
      
      // Fetch comparative analysis
      const comparative = await MarksAPI.getComparativeAnalysis();

      setDashboardData(dashboard);
      setMetricsData(metrics);
      setComparativeData(comparative);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPerformanceData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }));
  };

  const formatPieChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / Object.values(data).reduce((a, b) => a + b, 0)) * 100)
    }));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Statistics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={fetchData}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Statistics Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white rounded-lg shadow p-4">
        <nav className="flex flex-wrap gap-4">
          <Link
            to="/staff/statistics"
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 font-medium"
          >
            Overview Dashboard
          </Link>
          <Link
            to="/staff/statistics/school"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            School Dashboard
          </Link>
          <Link
            to="/staff/statistics/students"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Student Statistics
          </Link>
          <Link
            to="/staff/statistics/classes"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Class Statistics
          </Link>
        </nav>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'performance', label: 'Performance Metrics' },
            { id: 'comparative', label: 'Comparative Analysis' },
            { id: 'trends', label: 'Trends' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.total_students}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.total_assessments}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Overall Average</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.overall_average}%</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Trend</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{dashboardData.improvement_trend}</p>
                  </div>
                  {getTrendIcon(dashboardData.improvement_trend)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Categories Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieChartData(dashboardData.performance_categories)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => {
                        if (typeof value !== 'number') return '';
                        const total = formatPieChartData(dashboardData.performance_categories).reduce((sum, item) => sum + item.value, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${name}: ${percentage}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatPieChartData(dashboardData.performance_categories).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Average Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers and At Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.top_students.slice(0, 5).map((student, index) => (
                    <div key={student.student_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{student.full_name}</p>
                        <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{student.avg_score.toFixed(1)}%</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Award className="h-4 w-4 mr-1" />
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* At Risk Students */}
            <Card>
              <CardHeader>
                <CardTitle>Students At Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.at_risk_students.slice(0, 5).map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{student.full_name}</p>
                        <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{student.avg_score.toFixed(1)}%</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Needs Support
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Performance Metrics Tab */}
      {activeTab === 'performance' && metricsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Performance Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatPerformanceData(metricsData.subject_comparison)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Class Performance Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatPerformanceData(metricsData.class_comparison)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Descriptive Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Descriptive Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{metricsData.descriptive_stats.total_assessments}</p>
                  <p className="text-sm text-gray-600">Total Assessments</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{metricsData.descriptive_stats.average_score}%</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{metricsData.descriptive_stats.highest_score}%</p>
                  <p className="text-sm text-gray-600">Highest Score</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{metricsData.descriptive_stats.lowest_score}%</p>
                  <p className="text-sm text-gray-600">Lowest Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparative Analysis Tab */}
      {activeTab === 'comparative' && comparativeData && (
        <div className="space-y-6">
          {/* Year over Year Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Year-over-Year Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Previous Year ({comparativeData.year_over_year.previous_year.year})</p>
                  <p className="text-3xl font-bold text-gray-900">{comparativeData.year_over_year.previous_year.average}%</p>
                </div>
                <div className="text-center">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
                    comparativeData.year_over_year.improvement > 0 ? 'bg-green-100' : 
                    comparativeData.year_over_year.improvement < 0 ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {comparativeData.year_over_year.improvement > 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : comparativeData.year_over_year.improvement < 0 ? (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {Math.abs(comparativeData.year_over_year.improvement).toFixed(1)}% 
                    {comparativeData.year_over_year.improvement > 0 ? ' improvement' : 
                     comparativeData.year_over_year.improvement < 0 ? ' decline' : ' no change'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Year ({comparativeData.year_over_year.current_year.year})</p>
                  <p className="text-3xl font-bold text-gray-900">{comparativeData.year_over_year.current_year.average}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class and Subject Comparisons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(comparativeData.class_comparison).map(([name, data]) => ({
                    name,
                    average: data.average,
                    students: data.students
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#8884d8" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(comparativeData.subject_comparison).map(([name, data]) => ({
                    name,
                    average: data.average,
                    assessments: data.assessments
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#82ca9d" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && metricsData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metricsData.trend_data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Monthly Average"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StatisticsDashboard;

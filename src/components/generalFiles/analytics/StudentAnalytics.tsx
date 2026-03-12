import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { User, TrendingUp, TrendingDown, Target, Award, AlertCircle } from 'lucide-react';
import { SkeletonCards, SkeletonChart } from '../../ui/Skeleton';

interface StudentAnalyticsData {
  student_info: {
    name: string;
    student_id: string;
    class: string;
  };
  overall_average: number;
  total_assessments: number;
  subject_averages: Record<string, number>;
  subject_trends: Record<string, {
    trend: string;
    change: number;
    recent_score: number;
    initial_score: number;
  }>;
  grade_trends: Array<{
    date: string;
    subject: string;
    percentage: number;
    grade: string;
    exam_type: string;
    term: string;
  }>;
  class_percentile: number;
  school_percentile: number;
  class_average: number;
  school_average: number;
  improvement_rate: number;
  consistency_score: number;
  strengths: string[];
  weaknesses: string[];
  predicted_performance: Record<string, number>;
  recommendations: string[];
}

interface StudentAnalyticsProps {
  studentId: string;
  onBack?: () => void;
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ studentId, onBack }) => {
  const [studentData, setStudentData] = useState<StudentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff_access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `/api/statistics/student_analytics/?student_id=${studentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch student analytics');
      }

      const data = await response.json();
      setStudentData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const formatSubjectData = () => {
    if (!studentData) return [];
    
    return Object.entries(studentData.subject_averages).map(([subject, score]) => ({
      subject,
      current: score,
      predicted: studentData.predicted_performance[subject] || score,
      trend: studentData.subject_trends[subject]?.trend || 'stable'
    }));
  };

  const formatGradeTrendsData = () => {
    if (!studentData) return [];
    
    // Group by month and calculate average
    const monthlyData: Record<string, { total: number; count: number }> = {};
    
    studentData.grade_trends.forEach(grade => {
      const month = grade.date.substring(0, 7); // YYYY-MM format
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
      monthlyData[month].total += grade.percentage;
      monthlyData[month].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        average: Math.round(data.total / data.count * 100) / 100
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 60) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Student Analytics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={fetchStudentData}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return <div>No data available</div>;
  }

  const performanceLevel = getPerformanceLevel(studentData.overall_average);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back
            </button>
          )}
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{studentData.student_info.name}</h1>
              <p className="text-gray-600">
                ID: {studentData.student_info.student_id} | Class: {studentData.student_info.class}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Average</p>
                <p className="text-2xl font-bold text-gray-900">{studentData.overall_average}%</p>
              </div>
              <Award className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Class Percentile</p>
                <p className="text-2xl font-bold text-gray-900">{studentData.class_percentile}%</p>
              </div>
              <Target className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Consistency Score</p>
                <p className="text-2xl font-bold text-gray-900">{studentData.consistency_score}%</p>
              </div>
              <Target className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{studentData.total_assessments}</p>
              </div>
              <div className="h-6 w-6 bg-orange-500 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={formatSubjectData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Current Score" 
                  dataKey="current" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Predicted Score" 
                  dataKey="predicted" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.3} 
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatGradeTrendsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Monthly Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths and Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle>Strengths & Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                {studentData.strengths.length > 0 ? (
                  <ul className="space-y-1">
                    {studentData.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <Award className="h-4 w-4 text-green-500 mr-2" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No specific strengths identified yet</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-red-700 mb-2">Areas for Improvement</h4>
                {studentData.weaknesses.length > 0 ? (
                  <ul className="space-y-1">
                    {studentData.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">All subjects performing well</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(studentData.subject_trends).map(([subject, trend]) => (
                <div key={subject} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(trend.trend)}
                      <span className="font-medium text-gray-900">{subject}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {trend.recent_score}% 
                      <span className={`ml-1 text-xs ${
                        trend.change > 0 ? 'text-green-600' : 
                        trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        ({trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{trend.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Student Average</span>
                <span className="font-bold text-gray-900">{studentData.overall_average}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Class Average</span>
                <span className="font-bold text-blue-900">{studentData.class_average}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700">School Average</span>
                <span className="font-bold text-purple-900">{studentData.school_average}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Improvement Rate</span>
                <span className="font-bold text-green-900">{studentData.improvement_rate}% per assessment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentData.recommendations.length > 0 ? (
                studentData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                    <Target className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Keep up the excellent work! No specific recommendations at this time.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalytics;

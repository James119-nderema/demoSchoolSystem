import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Users, TrendingUp, Award, AlertCircle, BookOpen } from 'lucide-react';

interface ClassAnalyticsData {
  class_info: {
    name: string;
    grade_level: string;
    academic_year: string;
  };
  total_students: number;
  active_students: number;
  total_assessments: number;
  class_average: number;
  class_median: number;
  highest_score: number;
  lowest_score: number;
  standard_deviation: number;
  variance: number;
  quartile_data: {
    q1: number;
    q2: number;
    q3: number;
  };
  grade_distribution: Record<string, number>;
  subject_averages: Record<string, number>;
  pass_fail_rates: Record<string, { pass_rate: number; fail_rate: number }>;
  top_performers: Array<{
    name: string;
    student_id: string;
    average: number;
  }>;
  bottom_performers: Array<{
    name: string;
    student_id: string;
    average: number;
  }>;
  challenging_subjects: Array<{
    name: string;
    average: number;
  }>;
}

interface ClassAnalyticsProps {
  classId: string;
  onBack?: () => void;
  onStudentClick?: (studentId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({ 
  classId, 
  onBack, 
  onStudentClick 
}) => {
  const [classData, setClassData] = useState<ClassAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState('exam_1');

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff_access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const queryParams = new URLSearchParams({
        class_id: classId,
        term: selectedTerm,
        academic_year: selectedAcademicYear,
        exam_type: selectedExamType
      });

      const response = await fetch(
        `/api/input-marks/class-analytics/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch class analytics');
      }

      const data = await response.json();
      setClassData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId, selectedTerm, selectedAcademicYear, selectedExamType]);

  const formatSubjectData = () => {
    if (!classData) return [];
    
    return Object.entries(classData.subject_averages).map(([subject, average]) => ({
      subject,
      average: Math.round(average * 100) / 100,
      passRate: classData.pass_fail_rates[subject]?.pass_rate || 0,
      failRate: classData.pass_fail_rates[subject]?.fail_rate || 100
    }));
  };

  const formatGradeDistribution = () => {
    if (!classData) return [];
    
    return Object.entries(classData.grade_distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / classData.total_assessments) * 100)
    }));
  };

  const formatQuartileData = () => {
    if (!classData) return [];
    
    return [
      { name: 'Q1', value: classData.quartile_data.q1, label: '25th Percentile' },
      { name: 'Q2 (Median)', value: classData.quartile_data.q2, label: '50th Percentile' },
      { name: 'Q3', value: classData.quartile_data.q3, label: '75th Percentile' },
      { name: 'Average', value: classData.class_average, label: 'Class Average' }
    ];
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
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Class Analytics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={fetchClassData}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return <div>No data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {classData?.class_info?.name} Analytics
              </h1>
              <p className="text-gray-600">
                Grade Level: {classData?.class_info?.grade_level} | 
                Academic Year: {classData?.class_info?.academic_year}
              </p>
            </div>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
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
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Type
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classData.class_info.name}</h1>
              <p className="text-gray-600">
                Grade {classData.class_info.grade_level} | {classData.class_info.academic_year}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{classData.total_students}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Class Average</p>
                <p className="text-2xl font-bold text-gray-900">{classData.class_average}%</p>
              </div>
              <Award className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Median Score</p>
                <p className="text-2xl font-bold text-gray-900">{classData.class_median}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900">{classData.highest_score}%</p>
              </div>
              <Award className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{classData.total_assessments}</p>
              </div>
              <BookOpen className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatSubjectData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#8884d8" name="Average Score" />
                <Bar dataKey="passRate" fill="#82ca9d" name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution Pie Chart */}
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
      </div>

      {/* Statistical Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quartile Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Statistical Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatQuartileData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium text-blue-800">Standard Deviation</p>
                <p className="text-blue-600">{classData.standard_deviation}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="font-medium text-green-800">Variance</p>
                <p className="text-green-600">{classData.variance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenging Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Areas Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-red-700 mb-3">Most Challenging Subjects</h4>
                <div className="space-y-2">
                  {classData.challenging_subjects.map((subject, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <span className="font-medium text-gray-900">{subject.name}</span>
                      <span className="text-red-600 font-bold">{subject.average}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-medium text-yellow-800">Recommendations</h5>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• Consider additional support for struggling subjects</li>
                  <li>• Implement peer tutoring programs</li>
                  <li>• Review teaching methodologies for challenging topics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classData.top_performers.map((student, index) => (
                <div 
                  key={student.student_id} 
                  className={`flex items-center justify-between p-3 bg-green-50 rounded-lg ${
                    onStudentClick ? 'cursor-pointer hover:bg-green-100' : ''
                  }`}
                  onClick={() => onStudentClick && onStudentClick(student.student_id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{student.average}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Students Needing Support */}
        <Card>
          <CardHeader>
            <CardTitle>Students Needing Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classData.bottom_performers.map((student) => (
                <div 
                  key={student.student_id} 
                  className={`flex items-center justify-between p-3 bg-red-50 rounded-lg ${
                    onStudentClick ? 'cursor-pointer hover:bg-red-100' : ''
                  }`}
                  onClick={() => onStudentClick && onStudentClick(student.student_id)}
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{student.average}%</p>
                    <p className="text-xs text-red-500">Needs Support</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-gray-700">Performance Range</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {classData.lowest_score}% - {classData.highest_score}%
              </p>
              <p className="text-sm text-gray-600">Range Span: {(classData.highest_score - classData.lowest_score).toFixed(1)}%</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-gray-700">Class Consistency</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {classData.standard_deviation < 10 ? 'High' : 
                 classData.standard_deviation < 20 ? 'Medium' : 'Low'}
              </p>
              <p className="text-sm text-gray-600">Std Dev: {classData.standard_deviation}</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-gray-700">Overall Grade</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {classData.class_average >= 90 ? 'A' :
                 classData.class_average >= 80 ? 'B' :
                 classData.class_average >= 70 ? 'C' :
                 classData.class_average >= 60 ? 'D' : 'F'}
              </p>
              <p className="text-sm text-gray-600">Class Average: {classData.class_average}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassAnalytics;

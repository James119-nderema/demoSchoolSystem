import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award,
  ChevronDown,
  AlertCircle,
  Trophy,
  BookOpen
} from 'lucide-react';
import nationalResultsService, { 
  type NationalExamStatistics
} from '../../services/nationalResultsService';
import { SkeletonCards, SkeletonChart } from '../ui/Skeleton';

const GRADE_COLORS: Record<string, string> = {
  'EE1': '#22c55e',  // Exceeding Expectations Level 1 (Best)
  'EE2': '#4ade80',  // Exceeding Expectations Level 2
  'ME1': '#3b82f6',  // Meeting Expectations Level 1
  'ME2': '#60a5fa',  // Meeting Expectations Level 2
  'AE1': '#eab308',  // Approaching Expectations Level 1
  'AE2': '#facc15',  // Approaching Expectations Level 2
  'BE1': '#f97316',  // Below Expectations Level 1
  'BE2': '#ef4444'   // Below Expectations Level 2 (Lowest)
};

const NationalExamStatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<NationalExamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await nationalResultsService.getStatistics(selectedYear || undefined);
      setStats(data);
      if (data.years && data.years.length > 0 && !selectedYear) {
        setYears(data.years);
      }
    } catch (err: any) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    return GRADE_COLORS[grade] || '#9ca3af';
  };

  const getGradeBgClass = (grade: string) => {
    switch (grade) {
      case 'EE1':
      case 'EE2':
        return 'bg-green-100 text-green-800';  // Exceeding Expectations
      case 'ME1':
      case 'ME2':
        return 'bg-blue-100 text-blue-800';    // Meeting Expectations
      case 'AE1':
      case 'AE2':
        return 'bg-yellow-100 text-yellow-800'; // Approaching Expectations
      case 'BE1':
      case 'BE2':
        return 'bg-red-100 text-red-800';       // Below Expectations
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            National Exam Statistics
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive analysis of national examination results</p>
        </div>
        <SkeletonCards count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height="h-80" />
          <SkeletonChart height="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  if (!stats || stats.total_students === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
          <p className="text-gray-500 mt-2">Upload national exam results to see statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            National Exam Statistics
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive analysis of national examination results</p>
        </div>
        
        {/* Year Filter */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_students}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">EE (Exceeding) Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.grade_distribution.find(g => g.grade === 'EE1')?.count || 0) + 
                 (stats.grade_distribution.find(g => g.grade === 'EE2')?.count || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.classes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Subject</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {stats.subject_performance[0]?.subject || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
        <div className="flex flex-wrap gap-4 items-end justify-center min-h-[200px]">
          {['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'].map((grade) => {
            const gradeData = stats.grade_distribution.find(g => g.grade === grade);
            const count = gradeData?.count || 0;
            return (
              <div key={grade} className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-600 mb-1">{count}</span>
                <div 
                  className="w-12 rounded-t-lg transition-all duration-300"
                  style={{ 
                    height: `${Math.max((count / Math.max(stats.total_students, 1)) * 200, 20)}px`,
                    backgroundColor: getGradeColor(grade)
                  }}
                ></div>
                <span className="mt-2 text-sm font-medium text-gray-900">{grade}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance (Average out of 8)</h2>
        <div className="space-y-3">
          {stats.subject_performance.map((subject) => (
            <div key={subject.field} className="flex items-center gap-4">
              <div className="w-36 text-sm font-medium text-gray-700 truncate">{subject.subject}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(subject.average / 8) * 100}%`,
                    backgroundColor: subject.average >= 6 ? '#22c55e' : subject.average >= 4 ? '#eab308' : '#ef4444'
                  }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                  {subject.average.toFixed(1)}/8
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Count by Class Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Grade Distribution by Class</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                {['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'].map(grade => (
                  <th key={grade} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {grade}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.grade_count_by_class.map((row) => (
                <tr key={row.class_name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.class_name}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{row.student_count}</td>
                  {['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'].map(grade => (
                    <td key={grade} className="px-2 py-3 text-sm text-center">
                      {row.grades[grade] > 0 ? (
                        <span className={`inline-block min-w-[24px] px-1 py-0.5 rounded text-xs font-medium ${getGradeBgClass(grade)}`}>
                          {row.grades[grade]}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">{row.class_average}/8</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Students by Subject */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performing Students by Subject
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {stats.top_students_by_subject.map((subjectData) => (
            <div key={subjectData.field} className="border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                <h3 className="text-white font-medium">{subjectData.subject}</h3>
              </div>
              <div className="divide-y">
                {subjectData.students.map((student, index) => (
                  <div key={student.assessment_no} className="px-4 py-2 flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-500">{student.class_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{student.marks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Subject Performance Table */}
      {stats.class_subject_performance.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Subject Performance by Class</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  {stats.class_subject_performance[0]?.subjects.map(s => (
                    <th key={s.field} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {s.subject.split(' ')[0]}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.class_subject_performance.map((row) => (
                  <tr key={row.class_name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.class_name}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{row.student_count}</td>
                    {row.subjects.map(subject => (
                      <td key={subject.field} className="px-3 py-3 text-sm text-center">
                        <span className={`inline-block min-w-[40px] px-2 py-0.5 rounded text-xs font-medium ${
                          subject.average >= 70 ? 'bg-green-100 text-green-800' :
                          subject.average >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {subject.average}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">{row.overall_average}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NationalExamStatisticsPage;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { authFetch } from '../../../utils/apiInterceptors';
import { generateReportsPDF } from '../../../utils/pdfGenerator';
import { fetchGradeScale, getGrade as calculateGradeFromPercent, getGradeColor, GRADING_NOT_CONFIGURED_MESSAGE, type GradeDefinition } from '../../../utils/gradingUtils';

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

const ReportsDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noDataResponse, setNoDataResponse] = useState(false);
  const [gradeScale, setGradeScale] = useState<GradeDefinition[]>([]);

  // Filter states
  const term = searchParams.get('term') || '';
  const academicYear = searchParams.get('academic_year') || '';
  const examType = searchParams.get('exam_type') || '';
  const selectedClassId = searchParams.get('class_id') || '';

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoDataResponse(false);

      const fetchedGradeScale = await fetchGradeScale(selectedClassId || undefined);
      setGradeScale(fetchedGradeScale);

      const params = new URLSearchParams();
      if (term) params.append('term', term);
      if (academicYear) params.append('academic_year', academicYear);
      if (examType) params.append('exam_type', examType);
      if (selectedClassId) params.append('class_id', selectedClassId);

      const response = await authFetch(`/api/input-marks/reports-data/?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch reports data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
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
  }, [term, academicYear, examType, selectedClassId]);

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
                }, gradeScale);
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

  // Prepare chart data (only when data exists)
  let barChartData: Array<{ stream: string; top_students: number; subject_champions: number }> = [];
  let streamAverageData: Array<{ name: string; average: number; students: number }> = [];
  let summaryStats = { totalTopStudents: 0, totalChampions: 0, totalStreams: 0, overallAvg: 0 };

  if (reportsData?.pie_chart_data && Array.isArray(reportsData.pie_chart_data)) {
    barChartData = reportsData.pie_chart_data
      .filter(item => item.top_students > 0 || item.subject_champions > 0)
      .map(item => ({
        stream: item.stream,
        top_students: item.top_students,
        subject_champions: item.subject_champions
      }));

    summaryStats.totalTopStudents = reportsData.pie_chart_data.reduce((s, i) => s + i.top_students, 0);
    summaryStats.totalChampions = reportsData.pie_chart_data.reduce((s, i) => s + i.subject_champions, 0);
    summaryStats.totalStreams = reportsData.pie_chart_data.length;
  }

  if (reportsData?.stream_rankings && Array.isArray(reportsData.stream_rankings)) {
    // Flatten all streams across class levels for line chart
    streamAverageData = reportsData.stream_rankings.flatMap(cl =>
      (cl.streams || []).map(s => ({
        name: s.class_name || s.stream,
        average: Number((s.average || 0).toFixed(2)),
        students: s.total_students || 0
      }))
    );
    const allAvgs = streamAverageData.map(d => d.average).filter(a => a > 0);
    summaryStats.overallAvg = allAvgs.length ? Number((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1)) : 0;
  }

  const getGradeForAverage = (average: number): string => {
    if (!gradeScale.length) return GRADING_NOT_CONFIGURED_MESSAGE;
    try {
      return calculateGradeFromPercent(average || 0, gradeScale);
    } catch {
      return GRADING_NOT_CONFIGURED_MESSAGE;
    }
  };

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
              }, gradeScale);
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

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Top Students</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : summaryStats.totalTopStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Subject Champions</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : summaryStats.totalChampions}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs font-medium text-amber-100 uppercase tracking-wider">Streams</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : summaryStats.totalStreams}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs font-medium text-rose-100 uppercase tracking-wider">Overall Avg</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : `${summaryStats.overallAvg}%`}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart — Top Students vs Subject Champions per Stream */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Top Students vs Champions by Stream
            {loading && <span className="ml-2 text-sm text-gray-400 font-normal">(Updating…)</span>}
          </h2>
          <p className="text-xs text-gray-500 mb-4">Side-by-side comparison across all streams</p>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stream" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="top_students" name="Top Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="subject_champions" name="Subject Champions" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Loading chart data…</p>
                  </>
                ) : (
                  <>
                    <svg className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <p className="text-gray-400 text-sm">No stream data available</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Area Chart — Stream Averages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Stream Performance Overview
            {loading && <span className="ml-2 text-sm text-gray-400 font-normal">(Updating…)</span>}
          </h2>
          <p className="text-xs text-gray-500 mb-4">Average marks & student count per stream</p>
          {streamAverageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={streamAverageData}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="studGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="average" name="Average (%)" stroke="#6366f1" strokeWidth={2} fill="url(#avgGrad)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="students" name="Students" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Loading chart data…</p>
                  </>
                ) : (
                  <>
                    <svg className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <p className="text-gray-400 text-sm">No ranking data available</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Students Per Class */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Top 3 Students Per Class</h2>
        <p className="text-xs text-gray-500 mb-4">Highest performing students in each class</p>
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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {classData.students.map((student, studentIndex) => (
                <div key={studentIndex} className={`rounded-lg border p-4 ${studentIndex === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {student.position === 1 && '🥇'}
                        {student.position === 2 && '🥈'}
                        {student.position === 3 && '🥉'}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{student.student_name}</h4>
                        <p className="text-xs text-gray-500">{student.stream} Stream</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">#{student.position}</span>
                  </div>
                  <div className="mt-3 flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{student.average ? student.average.toFixed(2) : '0.00'}%</p>
                      <p className="text-xs text-gray-500">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-700">{student.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          ))
        )}
      </div>

      {/* Subject Champions Per Class */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Subject Champions Per Class</h2>
        <p className="text-xs text-gray-500 mb-4">Top scorer in each subject per class</p>
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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {classData.champions.map((champion, championIndex) => (
                <div key={championIndex} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{champion.student_name}</h4>
                        <p className="text-xs text-gray-500">{champion.stream} Stream</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{champion.marks}</p>
                      <p className="text-xs text-gray-500">marks</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {champion.subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          ))
        )}
      </div>

      {/* Stream Rankings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Stream Rankings</h2>
        <p className="text-xs text-gray-500 mb-4">Performance comparison across streams</p>
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
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
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
                      const gradeForAverage = getGradeForAverage(streamRank.average || 0);

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
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {classData.streams?.map((streamRank, streamIndex) => {
                  const gradeForAverage = getGradeForAverage(streamRank.average || 0);

                  return (
                    <div key={streamIndex} className={`rounded-lg border p-4 ${streamIndex === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">
                            {streamRank.position === 1 && '🥇'}
                            {streamRank.position === 2 && '🥈'}
                            {streamRank.position === 3 && '🥉'}
                            {streamRank.position > 3 && `#${streamRank.position}`}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{streamRank.class_name}</h4>
                            <span className="inline-flex mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {streamRank.stream}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(gradeForAverage)}`}>
                          {gradeForAverage}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-indigo-600">{streamRank.average ? streamRank.average.toFixed(2) : '0.00'}%</p>
                          <p className="text-xs text-gray-500">Average</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-700">{streamRank.total_students || 0}</p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;

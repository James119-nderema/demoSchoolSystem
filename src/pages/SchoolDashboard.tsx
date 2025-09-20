import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MarksAPI } from '../services/baseUrl';

interface ClassRankingData {
  class_id: number;
  class_name: string;
  stream: string;
  average_percentage: number;
  total_students: number;
  rank: number;
}

interface StreamStatistics {
  stream: string;
  total_classes: number;
  total_students: number;
  average_percentage: number;
  classes: ClassRankingData[];
}

interface SchoolOverview {
  total_students: number;
  total_classes: number;
  total_subjects: number;
  overall_average: number;
  streams: StreamStatistics[];
  top_performing_classes: ClassRankingData[];
  subject_averages: Array<{
    subject_name: string;
    average_percentage: number;
    total_students: number;
  }>;
}

const SchoolDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<SchoolOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff_access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = {
        term: '1',
        academic_year: '2024-2025',
        exam_type: 'exam_1'
      };

      const data = await MarksAPI.getSchoolAnalytics(params);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500">
        No dashboard data available.
      </div>
    );
  }

  const filteredStreams = selectedStream === 'all' 
    ? (dashboardData.streams || [])
    : (dashboardData.streams || []).filter(stream => stream.stream === selectedStream);

  // const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">School Dashboard</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total Students</h3>
            <p className="text-2xl font-bold text-blue-900">{dashboardData.total_students}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Total Classes</h3>
            <p className="text-2xl font-bold text-green-900">{dashboardData.total_classes}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Total Subjects</h3>
            <p className="text-2xl font-bold text-purple-900">{dashboardData.total_subjects}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">Overall Average</h3>
            <p className="text-2xl font-bold text-orange-900">{dashboardData.overall_average?.toFixed(1) ?? 'N/A'}%</p>
          </div>
        </div>

        {/* Stream Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Stream:
          </label>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Streams</option>
            {(dashboardData.streams || []).map(stream => (
              <option key={stream.stream} value={stream.stream}>
                {stream.stream}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stream Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Stream Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.streams || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stream" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="average_percentage" fill="#8884d8" name="Average %" />
              <Bar dataKey="total_students" fill="#82ca9d" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.subject_averages || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average_percentage" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Rankings by Stream */}
      {filteredStreams.map(stream => (
        <div key={stream.stream} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {stream.stream} Stream - Class Rankings
          </h2>
          <div className="mb-4 text-sm text-gray-600">
            Total Classes: {stream.total_classes} | Total Students: {stream.total_students} | 
            Stream Average: {stream.average_percentage?.toFixed(1) ?? 'N/A'}%
          </div>
          
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
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stream.classes.map((classData) => (
                  <tr key={classData.class_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        classData.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        classData.rank <= 3 ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        #{classData.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {classData.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classData.total_students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classData.average_percentage?.toFixed(1) ?? 'N/A'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Top Performing Classes Overall */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Classes (All Streams)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(dashboardData.top_performing_classes || []).slice(0, 6).map((classData, index) => (
            <div key={classData.class_id} className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">{classData.class_name}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-800' :
                  index === 2 ? 'bg-orange-300 text-orange-900' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  #{index + 1}
                </span>
              </div>
              <p className="text-sm text-gray-600">Stream: {classData.stream}</p>
              <p className="text-sm text-gray-600">Students: {classData.total_students}</p>
              <p className="text-lg font-bold text-indigo-600">{classData.average_percentage?.toFixed(1) ?? 'N/A'}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;

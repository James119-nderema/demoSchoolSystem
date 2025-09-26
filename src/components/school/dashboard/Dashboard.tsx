import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIService, MarksAPI, DataAPI } from '../../../services/baseUrl';
import { Users, BookOpen, School, UserCheck, Trophy, TrendingUp, Calendar, Award, Target, BarChart3 } from 'lucide-react';

interface SchoolInfo {
  id: number;
  name: string;
  email: string;
}

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalSubjects: number;
  totalClasses: number;
  activeStudents: number;
  recentResults: number;
}

interface TopStudent {
  id: number;
  name: string;
  class: string;
  stream: string;
  totalMarks: number;
  percentage: number;
  subjects: number;
}

interface ClassAverage {
  class: string;
  stream?: string;
  averagePercentage: number;
  totalStudents: number;
  term: string;
  examType: string;
  lastUpdated: string;
}

interface TopPerformer {
  classNumber: string;
  student: TopStudent;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  count?: number;
}

const SchoolDashboard: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalStaff: 0,
    totalSubjects: 0,
    totalClasses: 0,
    activeStudents: 0,
    recentResults: 0
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [classAverages, setClassAverages] = useState<ClassAverage[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedSchoolInfo = localStorage.getItem('school_info');

    if (!token) {
      navigate('/login');
      return;
    }

    if (storedSchoolInfo) {
      setSchoolInfo(JSON.parse(storedSchoolInfo));
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      // Use the comprehensive endpoint for better performance
      const dashboardData = await APIService.get('/api/school-dashboard/comprehensive/', {}, 'school');
      
      if (dashboardData) {
        setStats({
          totalStudents: dashboardData.stats?.totalStudents || 0,
          totalStaff: dashboardData.stats?.totalStaff || 0,
          totalSubjects: dashboardData.stats?.totalSubjects || 0,
          totalClasses: dashboardData.stats?.totalClasses || 0,
          activeStudents: dashboardData.stats?.activeStudents || 0,
          recentResults: dashboardData.stats?.recentResults || 0
        });
        
        // Transform top performers data - data is already in correct format from backend
        const topPerformersData = dashboardData.topPerformers || [];
        setTopPerformers(topPerformersData);
        
        // Transform class averages data - data is already in correct format from backend
        const classAveragesData = dashboardData.classAverages || [];
        setClassAverages(classAveragesData);
        
        // Transform recent activities data - data is already in correct format from backend
        const activitiesData = dashboardData.recentActivities || [];
        setRecentActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to individual endpoints if comprehensive fails
      await Promise.all([
        fetchBasicStats(),
        fetchTopPerformers(),
        fetchClassAverages(),
        fetchRecentActivities()
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      // Use the dedicated stats endpoint
      const statsData = await APIService.get('/api/school-dashboard/stats/', {}, 'school');
      
      if (statsData) {
        setStats({
          totalStudents: statsData.totalStudents || 0,
          totalStaff: statsData.totalStaff || 0,
          totalSubjects: statsData.totalSubjects || 0,
          totalClasses: statsData.totalClasses || 0,
          activeStudents: statsData.activeStudents || 0,
          recentResults: statsData.recentResults || 0
        });
      }
    } catch (error) {
      console.error('Error fetching basic stats:', error);
      // Fallback to original method
      try {
        const [studentsData, staffData, subjectsData, classesData] = await Promise.all([
          DataAPI.getStudents({ page_size: '1' }), // Just get count
          APIService.get('/api/staff/', { page_size: '1' }, 'school'),
          DataAPI.getSubjects({ page_size: '1' }),
          DataAPI.getClasses({ page_size: '1' })
        ]);

        const recentResultsData = await MarksAPI.getResults({ page_size: '1' });

        setStats({
          totalStudents: studentsData.count || 0,
          totalStaff: staffData.count || 0,
          totalSubjects: subjectsData.count || 0,
          totalClasses: classesData.count || 0,
          activeStudents: studentsData.results?.filter((s: any) => s.status === 'active').length || 0,
          recentResults: recentResultsData.count || 0
        });
      } catch (fallbackError) {
        console.error('Error with fallback stats fetch:', fallbackError);
      }
    }
  };

  const fetchTopPerformers = async () => {
    try {
      // Use the dedicated top performers endpoint
      const topPerformersData = await APIService.get('/api/school-dashboard/top-performers-by-class/', {}, 'school');
      
      if (topPerformersData) {
        // Data is already in the correct format from the backend
        setTopPerformers(topPerformersData);
      }
    } catch (error) {
      console.error('Error fetching top performers:', error);
      // Fallback to original method
      try {
        const classBestPerformers: { [key: string]: TopStudent } = {};

        // Since the fallback analytics endpoint requires class_id and is complex,
        // we'll skip the fallback for top performers and just show empty state
        console.log('Fallback top performers data fetch skipped - using new dashboard endpoints instead');

        const topPerformersArray = Object.entries(classBestPerformers)
          .map(([classNumber, student]) => ({ classNumber, student }))
          .sort((a, b) => parseInt(a.classNumber) - parseInt(b.classNumber));

        setTopPerformers(topPerformersArray);
      } catch (fallbackError) {
        console.error('Error with fallback top performers fetch:', fallbackError);
      }
    }
  };

  const fetchClassAverages = async () => {
    try {
      // Use the dedicated class averages endpoint
      const classAveragesData = await APIService.get('/api/school-dashboard/class-averages/', {}, 'school');
      
      if (classAveragesData) {
        // Data is already in the correct format from the backend
        setClassAverages(classAveragesData);
      }
    } catch (error) {
      console.error('Error fetching class averages:', error);
      // Fallback to original method
      try {
        // Fallback class averages skipped - using new dashboard endpoints instead
        console.log('Fallback class averages data fetch skipped - using new dashboard endpoints instead');
      } catch (fallbackError) {
        console.error('Error with fallback class averages fetch:', fallbackError);
      }
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Use the dedicated recent activities endpoint
      const activitiesData = await APIService.get('/api/school-dashboard/recent-activities/', {}, 'school');
      
      if (activitiesData) {
        // Data is already in the correct format from the backend
        setRecentActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Fallback to original method
      try {
        const recentResults = await MarksAPI.getResults({ 
          page_size: '10',
          ordering: '-created_at'
        });

        const recentStudents = await DataAPI.getStudents({ 
          page_size: '5',
          ordering: '-date_added'
        });

        const activities: RecentActivity[] = [];

        if (recentResults.results) {
          const resultsCount = recentResults.results.length;
          if (resultsCount > 0) {
            activities.push({
              type: 'results',
              description: `${resultsCount} new results added`,
              timestamp: recentResults.results[0].created_at || new Date().toISOString(),
              count: resultsCount
            });
          }
        }

        if (recentStudents.results) {
          const studentsCount = recentStudents.results.length;
          if (studentsCount > 0) {
            activities.push({
              type: 'students',
              description: `${studentsCount} new students registered`,
              timestamp: recentStudents.results[0].date_added || new Date().toISOString(),
              count: studentsCount
            });
          }
        }

        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities);
      } catch (fallbackError) {
        console.error('Error with fallback recent activities fetch:', fallbackError);
      }
    }
  };

  // Helper functions

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('school_info');
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {schoolInfo?.name} Dashboard
              </h1>
              <p className="text-gray-600">{schoolInfo?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition duration-200 flex items-center space-x-2"
              >
                <TrendingUp className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.activeStudents} active
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalStaff.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Teachers & Admin</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalClasses.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All streams</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <School className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalSubjects.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Curriculum</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers by Class */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Top Performers by Class</h3>
                </div>
                <span className="text-sm text-gray-500">Latest Results</span>
              </div>
            </div>
            <div className="p-6">
              {topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {topPerformers.map((performer) => (
                    <div key={performer.classNumber} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
                          <span className="text-lg font-bold text-yellow-700">
                            {performer.classNumber}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{performer.student.name}</p>
                          <p className="text-sm text-gray-600">
                            Class {performer.student.class}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          {performer.student.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {performer.student.subjects} subjects
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Class Averages - Bar Graph */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Class Performance</h3>
                </div>
                <span className="text-sm text-gray-500">Latest Term</span>
              </div>
            </div>
            <div className="p-6">
              {classAverages.length > 0 ? (
                <div className="space-y-4">
                  {/* Bar Chart Container */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {classAverages.slice(0, 8).map((classAvg, index) => {
                        const maxPercentage = Math.max(...classAverages.map(c => c.averagePercentage));
                        const barWidth = (classAvg.averagePercentage / maxPercentage) * 100;
                        
                        return (
                          <div key={`${classAvg.class}-${index}`} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                                  {classAvg.class}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({classAvg.totalStudents} students)
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">
                                {classAvg.averagePercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                              <div 
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  classAvg.averagePercentage >= 80 ? 'bg-green-500' :
                                  classAvg.averagePercentage >= 60 ? 'bg-blue-500' :
                                  classAvg.averagePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ 
                                  width: `${barWidth}%`,
                                  minWidth: classAvg.averagePercentage > 0 ? '8px' : '0px'
                                }}
                              ></div>
                              {/* Percentage label inside bar if there's space */}
                              {barWidth > 20 && (
                                <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium text-white">
                                  {classAvg.averagePercentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-gray-600">Excellent (80%+)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-gray-600">Good (60-79%)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-gray-600">Average (40-59%)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-gray-600">Needs Improvement (&lt;40%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No class averages available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
            </div>
            <div className="p-6">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                        {activity.type === 'results' ? (
                          <Target className="w-5 h-5 text-green-600" />
                        ) : (
                          <Users className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                      {activity.count && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          {activity.count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition duration-200 flex items-center space-x-3">
                  <Users className="w-5 h-5" />
                  <span>Manage Students</span>
                </button>

                <button className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition duration-200 flex items-center space-x-3">
                  <UserCheck className="w-5 h-5" />
                  <span>Manage Staff</span>
                </button>

                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition duration-200 flex items-center space-x-3">
                  <School className="w-5 h-5" />
                  <span>Manage Classes</span>
                </button>

                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition duration-200 flex items-center space-x-3">
                  <BookOpen className="w-5 h-5" />
                  <span>Manage Subjects</span>
                </button>

                <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition duration-200 flex items-center space-x-3">
                  <Award className="w-5 h-5" />
                  <span>View Reports</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchoolDashboard;

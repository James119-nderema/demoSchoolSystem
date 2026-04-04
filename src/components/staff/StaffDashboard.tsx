import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../../services/baseUrl';
import { Users, BookOpen, School, UserCheck, Trophy, Calendar, Award, Target, BarChart3, RefreshCw, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

interface StaffInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school?: {
    name: string;
  };
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

const StaffDashboard: React.FC = () => {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
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
  const [showPerformers, setShowPerformers] = useState(true);
  const [showClassPerf, setShowClassPerf] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('staff_access_token');
    const storedStaffInfo = localStorage.getItem('staff_info');

    if (!token) {
      navigate('/login');
      return;
    }

    if (storedStaffInfo) {
      setStaffInfo(JSON.parse(storedStaffInfo));
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const dashboardData = await APIService.get('/api/school-dashboard/comprehensive/', {}, 'staff');
      
      if (dashboardData) {
        setStats({
          totalStudents: dashboardData.stats?.totalStudents || 0,
          totalStaff: dashboardData.stats?.totalStaff || 0,
          totalSubjects: dashboardData.stats?.totalSubjects || 0,
          totalClasses: dashboardData.stats?.totalClasses || 0,
          activeStudents: dashboardData.stats?.activeStudents || 0,
          recentResults: dashboardData.stats?.recentResults || 0
        });
        setTopPerformers(dashboardData.topPerformers || []);
        setClassAverages(dashboardData.classAverages || []);
        setRecentActivities(dashboardData.recentActivities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      const statsData = await APIService.get('/api/school-dashboard/stats/', {}, 'staff');
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
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const data = await APIService.get('/api/school-dashboard/top-performers-by-class/', {}, 'staff');
      if (data) setTopPerformers(data);
    } catch (error) {
      console.error('Error fetching top performers:', error);
    }
  };

  const fetchClassAverages = async () => {
    try {
      const data = await APIService.get('/api/school-dashboard/class-averages/', {}, 'staff');
      if (data) setClassAverages(data);
    } catch (error) {
      console.error('Error fetching class averages:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const data = await APIService.get('/api/school-dashboard/recent-activities/', {}, 'staff');
      if (data) setRecentActivities(data);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_refresh_token');
    localStorage.removeItem('staff_info');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3 sm:py-4 gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{staffInfo?.school?.name || 'Staff Dashboard'}</h1>
                <div className="animate-pulse bg-gray-200 rounded h-4 w-40 mt-1" />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-2"><div className="animate-pulse bg-gray-200 rounded h-3 w-20" /><div className="animate-pulse bg-gray-200 rounded h-7 w-14" /></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6"><div className="animate-pulse bg-gray-200 rounded h-4 w-36 mb-4" /><div className="animate-pulse bg-gray-100 rounded h-48" /></div>
            <div className="bg-white rounded-xl shadow-sm border p-6"><div className="animate-pulse bg-gray-200 rounded h-4 w-36 mb-4" /><div className="animate-pulse bg-gray-100 rounded h-48" /></div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, sub: `${stats.activeStudents} active`, icon: Users, color: 'blue' },
    { label: 'Total Staff', value: stats.totalStaff, sub: 'Teachers & Admin', icon: UserCheck, color: 'green' },
    { label: 'Total Classes', value: stats.totalClasses, sub: 'All streams', icon: School, color: 'purple' },
    { label: 'Total Subjects', value: stats.totalSubjects, sub: 'Curriculum', icon: BookOpen, color: 'orange' },
  ];

  const colorMap: Record<string, { bg: string; text: string; lightBg: string }> = {
    blue:   { bg: 'bg-blue-600',   text: 'text-blue-600',   lightBg: 'bg-blue-50' },
    green:  { bg: 'bg-green-600',  text: 'text-green-600',  lightBg: 'bg-green-50' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', lightBg: 'bg-purple-50' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', lightBg: 'bg-orange-50' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 gap-2">
            {/* Left: Title */}
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {staffInfo?.school?.name || 'Staff Dashboard'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Welcome, {staffInfo?.first_name} {staffInfo?.last_name}
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const c = colorMap[card.color];
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-sm font-medium text-gray-500 truncate">{card.label}</p>
                    <p className={`text-xl sm:text-3xl font-bold ${c.text} mt-0.5`}>{card.value.toLocaleString()}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{card.sub}</p>
                  </div>
                  <div className={`p-2 sm:p-3 ${c.lightBg} rounded-lg flex-shrink-0`}>
                    <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${c.text}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Top Performers + Class Performance ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setShowPerformers(!showPerformers)}
              className="w-full flex items-center justify-between p-4 sm:p-5 border-b border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Top Performers by Class</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:inline">Latest Results</span>
                {showPerformers ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>
            {showPerformers && (
              <div className="p-3 sm:p-5">
                {topPerformers.length > 0 ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    {topPerformers.map((performer) => (
                      <div key={performer.classNumber} className="flex items-center justify-between p-2.5 sm:p-3.5 bg-gray-50 rounded-lg gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex-shrink-0">
                            <span className="text-xs sm:text-sm font-bold text-yellow-700">{performer.classNumber}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{performer.student.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">Class {performer.student.class}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm sm:text-lg font-bold text-green-600">{performer.student.percentage.toFixed(1)}%</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">{performer.student.subjects} subj</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400">No performance data available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Class Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setShowClassPerf(!showClassPerf)}
              className="w-full flex items-center justify-between p-4 sm:p-5 border-b border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Class Performance</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:inline">Latest Term</span>
                {showClassPerf ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>
            {showClassPerf && (
              <div className="p-3 sm:p-5">
                {classAverages.length > 0 ? (
                  <div className="space-y-3">
                    {classAverages.slice(0, 8).map((classAvg, index) => {
                      const maxPct = Math.max(...classAverages.map(c => c.averagePercentage));
                      const barW = maxPct > 0 ? (classAvg.averagePercentage / maxPct) * 100 : 0;
                      const barColor =
                        classAvg.averagePercentage >= 80 ? 'bg-green-500' :
                        classAvg.averagePercentage >= 60 ? 'bg-blue-500' :
                        classAvg.averagePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

                      return (
                        <div key={`${classAvg.class}-${index}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{classAvg.class}</span>
                              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">({classAvg.totalStudents})</span>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 flex-shrink-0">
                              {classAvg.averagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                              style={{ width: `${barW}%`, minWidth: classAvg.averagePercentage > 0 ? '6px' : '0' }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Legend */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded inline-block" /> 80%+</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded inline-block" /> 60-79%</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-500 rounded inline-block" /> 40-59%</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded inline-block" /> &lt;40%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400">No class averages available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Activities + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setShowActivities(!showActivities)}
              className="w-full flex items-center justify-between p-4 sm:p-5 border-b border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recent Activity</h3>
              </div>
              {showActivities ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showActivities && (
              <div className="p-3 sm:p-5">
                {recentActivities.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-green-100 rounded-full flex-shrink-0">
                          {activity.type === 'results' ? (
                            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                          ) : (
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                        </div>
                        {activity.count != null && (
                          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0">
                            {activity.count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400">No recent activities</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-3 sm:p-5">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
                {[
                  { label: 'Students', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
                  { label: 'Staff', icon: UserCheck, color: 'bg-green-600 hover:bg-green-700' },
                  { label: 'Classes', icon: School, color: 'bg-purple-600 hover:bg-purple-700' },
                  { label: 'Subjects', icon: BookOpen, color: 'bg-orange-600 hover:bg-orange-700' },
                  { label: 'Reports', icon: Award, color: 'bg-yellow-600 hover:bg-yellow-700' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className={`${action.color} text-white p-2.5 sm:p-3.5 rounded-lg transition-colors flex items-center gap-2 sm:gap-2.5 w-full`}
                  >
                    <action.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">View {action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;

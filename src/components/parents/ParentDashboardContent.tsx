import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  full_name: string;
  admission_number: string;
  admission_class: string;
  current_class: string;
  date_of_birth: string;
  gender: string;
  address: string;
  status: string;
  date_added: string;
  age: number;
  school_name: string;
}

interface School {
  name: string;
  principal_name: string;
  phone_number: string;
  email: string;
}

interface Parent {
  full_name: string;
  email: string;
  phone_number: string;
  is_verified: boolean;
}

interface DashboardStats {
  student_status: string;
  current_class: string;
  admission_date: string;
  student_age: number;
}

interface DashboardData {
  parent: Parent;
  student: Student;
  school: School;
  dashboard_stats: DashboardStats;
}

export default function ParentDashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('parent_access_token');
      if (!token) {
        navigate('/parent/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/parents/dashboard/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else if (response.status === 401) {
        localStorage.removeItem('parent_access_token');
        localStorage.removeItem('parent_refresh_token');
        localStorage.removeItem('parent_info');
        navigate('/parent/login');
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Student Status</dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">{dashboardData.dashboard_stats.student_status}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Class</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.dashboard_stats.current_class}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Age</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.dashboard_stats.student_age} years</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Admission Date</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.dashboard_stats.admission_date ? 
                      new Date(dashboardData.dashboard_stats.admission_date).toLocaleDateString() : 
                      'N/A'
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information Card */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Student Information</h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-900">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.student.full_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Admission Number</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.student.admission_number}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Gender</dt>
                <dd className="mt-1 text-sm text-gray-700 capitalize">{dashboardData.student.gender}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {new Date(dashboardData.student.date_of_birth).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Address</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.student.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">School</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.student.school_name}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* School Information Card */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">School Information</h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-900">School Name</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.school.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Principal</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.school.principal_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Phone</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.school.phone_number}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Email</dt>
                <dd className="mt-1 text-sm text-gray-700">{dashboardData.school.email}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

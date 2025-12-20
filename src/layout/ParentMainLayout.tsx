import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import ParentSidebar from '../components/sidebars/ParentSidebar';
import { API_BASE_URL } from '../config/environment';

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

export interface DashboardData {
  parent: Parent;
  student: Student;
  school: School;
  dashboard_stats: DashboardStats;
}

interface ParentMainLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function ParentMainLayout({ children, title = "Parent Dashboard" }: ParentMainLayoutProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('parent_access_token');
      // Temporarily comment out redirect for debugging
      // if (!token) {
      //   navigate('/parent/login');
      //   return;
      // }

      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/parents/dashboard/`, {
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
          // navigate('/parent/login');
        } else {
          setError('Failed to fetch dashboard data');
        }
      } else {
        // Set dummy data for testing
        setDashboardData({
          parent: { full_name: 'Test Parent', email: 'test@test.com', phone_number: '123', is_verified: true },
          student: { id: 1, full_name: 'Test Student', admission_number: '001', admission_class: 'Grade 1', current_class: 'Grade 1', date_of_birth: '2015-01-01', gender: 'male', address: 'Test Address', status: 'active', date_added: '2024-01-01', age: 9, school_name: 'Test School' },
          school: { name: 'Test School', principal_name: 'Test Principal', phone_number: '123', email: 'school@test.com' },
          dashboard_stats: { student_status: 'active', current_class: 'Grade 1', admission_date: '2024-01-01', student_age: 9 }
        });
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching dashboard data:', err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Sidebar props
  const sidebarProps = {
    parentName: dashboardData?.parent?.full_name || 'Loading...',
    studentName: dashboardData?.student?.full_name || 'Loading...',
    isOpen: sidebarOpen,
    onToggle: toggleSidebar
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <ParentSidebar {...sidebarProps} />
      
      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
                  {dashboardData && (
                    <p className="text-sm text-gray-600 truncate">
                      Welcome back, {dashboardData.parent.full_name}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Account verification status */}
              <div className="flex items-center space-x-4">
                {dashboardData?.parent ? (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    dashboardData.parent.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {dashboardData.parent.is_verified ? 'Verified' : 'Pending Verification'}
                  </div>
                ) : (
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Error State */}
          {error && (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Export the hook for child components to access dashboard data
export function useParentDashboard() {
  // This can be enhanced with a context if needed
  return {
    // For now, components can fetch their own data
    // but this can be refactored to use React Context
  };
}

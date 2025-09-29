import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

interface StaffSidebarNewProps {
  staffInfo: {
    id: string;
    email: string;
    full_name: string;
    school_name: string;
    phone_number: string;
  };
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export default function StaffSidebarNew({ staffInfo, isOpen, onToggle, onLogout }: StaffSidebarNewProps) {
  const location = useLocation();
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isReportCardsOpen, setIsReportCardsOpen] = useState(false);

  // Get the current active item based on the current path
  const getCurrentActiveItem = () => {
    const path = location.pathname;
    
    if (path === '/staff/dashboard') return 'dashboard';
    if (path === '/staff/students') return 'students';
    if (path === '/staff/classes') return 'classes';
    if (path === '/staff/subjects') return 'subjects';
    if (path === '/staff/input-marks' || path === '/staff/view-results' || path === '/staff/results') return 'results';
    if (path.startsWith('/staff/statistics')) return 'statistics';
    if (path === '/staff/reports') return 'reports';
    if (path.startsWith('/staff/report-card') || path.startsWith('/staff/reports/pdf')) return 'report-cards';
    if (path === '/staff/profile') return 'profile';
    
    return 'dashboard';
  };

  const activeItem = getCurrentActiveItem();

  const isResultsActive = () => {
    return location.pathname === '/staff/results' || 
           location.pathname === '/staff/input-marks' || 
           location.pathname === '/staff/view-results';
  };

  const isStatisticsActive = () => {
    return location.pathname === '/staff/statistics' || 
           location.pathname === '/staff/statistics/school' || 
           location.pathname === '/staff/statistics/students' || 
           location.pathname === '/staff/statistics/classes' ||
           location.pathname.startsWith('/staff/statistics/');
  };

  const isReportCardsActive = () => {
    return location.pathname.startsWith('/staff/reports/pdf') ||
           location.pathname.startsWith('/staff/report-card');
  };

  // Auto-open dropdowns when on related pages
  useEffect(() => {
    if (isResultsActive()) {
      setIsResultsOpen(true);
    }
    if (isStatisticsActive()) {
      setIsStatisticsOpen(true);
    }
    if (isReportCardsActive()) {
      setIsReportCardsOpen(true);
    }
  }, [location.pathname]);

  const mainMenuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
        </svg>
      ),
      href: '/staff/dashboard'
    },
    {
      id: 'students',
      name: 'Students',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: '/staff/students'
    },
    {
      id: 'classes',
      name: 'Classes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: '/staff/classes'
    },
    {
      id: 'subjects',
      name: 'Subjects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/staff/subjects'
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/staff/reports'
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/staff/profile'
    }
  ];

  const resultsSubItems = [
    {
      name: 'Input Marks',
      href: '/staff/input-marks',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      name: 'View Results',
      href: '/staff/view-results',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const statisticsSubItems = [
    {
      name: 'Overview Dashboard',
      href: '/staff/statistics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      name: 'School Dashboard',
      href: '/staff/statistics/school',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: 'Student Statistics',
      href: '/staff/statistics/students',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      name: 'Class Statistics',
      href: '/staff/statistics/classes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  const reportCardsSubItems = [
    {
      name: 'Student Report Cards',
      href: '/staff/report-card/pdf',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const handleItemClick = () => {
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64`}>
        
        {/* Header - Using indigo theme similar to original staff sidebar */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {staffInfo.full_name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Staff Portal</h3>
                <p className="text-xs text-indigo-200 truncate">{staffInfo.school_name}</p>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button
              onClick={onToggle}
              className="lg:hidden p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Staff info */}
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="text-sm">
              <p className="font-medium truncate">{staffInfo.full_name}</p>
              <p className="text-indigo-200 text-xs mt-1 truncate">{staffInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Main Menu Items */}
          {mainMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              onClick={handleItemClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeItem === item.id
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeItem === item.id ? 'text-indigo-700' : 'text-gray-400'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}

          {/* Results Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setIsResultsOpen(!isResultsOpen)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
                isResultsActive()
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isResultsActive() ? 'text-indigo-700' : 'text-gray-400'}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <span className="font-medium">Results</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${isResultsOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isResultsOpen && (
              <div className="ml-6 space-y-1">
                {resultsSubItems.map((subItem) => (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    onClick={handleItemClick}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === subItem.href
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={location.pathname === subItem.href ? 'text-indigo-700' : 'text-gray-400'}>
                      {subItem.icon}
                    </span>
                    <span className="font-medium text-sm">{subItem.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Statistics Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setIsStatisticsOpen(!isStatisticsOpen)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
                isStatisticsActive()
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isStatisticsActive() ? 'text-indigo-700' : 'text-gray-400'}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <span className="font-medium">Statistics</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${isStatisticsOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isStatisticsOpen && (
              <div className="ml-6 space-y-1">
                {statisticsSubItems.map((subItem) => (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    onClick={handleItemClick}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === subItem.href
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={location.pathname === subItem.href ? 'text-indigo-700' : 'text-gray-400'}>
                      {subItem.icon}
                    </span>
                    <span className="font-medium text-sm">{subItem.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Report Cards Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setIsReportCardsOpen(!isReportCardsOpen)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
                isReportCardsActive()
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isReportCardsActive() ? 'text-indigo-700' : 'text-gray-400'}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="font-medium">Report Cards</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${isReportCardsOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isReportCardsOpen && (
              <div className="ml-6 space-y-1">
                {reportCardsSubItems.map((subItem) => (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    onClick={handleItemClick}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === subItem.href
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={location.pathname === subItem.href ? 'text-indigo-700' : 'text-gray-400'}>
                      {subItem.icon}
                    </span>
                    <span className="font-medium text-sm">{subItem.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}

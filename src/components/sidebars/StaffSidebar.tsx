import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface StaffSidebarProps {
  staffInfo: {
    id: string;
    email: string;
    full_name: string;
    school_name: string;
    phone_number: string;
  };
  onLogout: () => void;
}

const StaffSidebar: React.FC<StaffSidebarProps> = ({ staffInfo, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isReportCardsOpen, setIsReportCardsOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/staff/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
        </svg>
      )
    },
    {
      name: 'Students',
      path: '/staff/students',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      name: 'Classes',
      path: '/staff/classes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: 'Subjects',
      path: '/staff/subjects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: 'Results',
      path: '/staff/results',
      hasDropdown: true,
      subItems: [
        {
          name: 'Input Marks',
          path: '/staff/input-marks',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )
        },
        {
          name: 'View Results',
          path: '/staff/view-results',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        }
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Statistics',
      path: '/staff/statistics',
      hasDropdown: true,
      subItems: [
        {
          name: 'Overview Dashboard',
          path: '/staff/statistics',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          )
        },
        {
          name: 'School Dashboard',
          path: '/staff/statistics/school',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        },
        {
          name: 'Student Statistics',
          path: '/staff/statistics/students',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )
        },
        {
          name: 'Class Statistics',
          path: '/staff/statistics/classes',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Reports',
      path: '/staff/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'Report Cards',
      path: '/staff/reports/pdf',
      hasDropdown: true,
      subItems: [
        {
          name: 'Student Report Cards',
          path: '/staff/report-card/pdf',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/staff/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
    return location.pathname.startsWith('/staff/reports/pdf');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleResultsToggle = () => {
    setIsResultsOpen(!isResultsOpen);
  };

  const handleStatisticsToggle = () => {
    setIsStatisticsOpen(!isStatisticsOpen);
  };

  const handleReportCardsToggle = () => {
    setIsReportCardsOpen(!isReportCardsOpen);
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

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden bg-indigo-700 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-white">Staff Portal</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-700">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-lg font-semibold text-white">Staff Portal</h1>
              </div>
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <SidebarContent 
                  staffInfo={staffInfo} 
                  menuItems={menuItems} 
                  isActive={isActive} 
                  isResultsActive={isResultsActive}
                  isResultsOpen={isResultsOpen}
                  isStatisticsActive={isStatisticsActive}
                  isStatisticsOpen={isStatisticsOpen}
                  isReportCardsActive={isReportCardsActive}
                  isReportCardsOpen={isReportCardsOpen}
                  handleNavigation={handleNavigation} 
                  handleResultsToggle={handleResultsToggle}
                  handleStatisticsToggle={handleStatisticsToggle}
                  handleReportCardsToggle={handleReportCardsToggle}
                  onLogout={onLogout} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-indigo-700">
            <SidebarContent 
              staffInfo={staffInfo} 
              menuItems={menuItems} 
              isActive={isActive} 
              isResultsActive={isResultsActive}
              isResultsOpen={isResultsOpen}
              isStatisticsActive={isStatisticsActive}
              isStatisticsOpen={isStatisticsOpen}
              isReportCardsActive={isReportCardsActive}
              isReportCardsOpen={isReportCardsOpen}
              handleNavigation={handleNavigation} 
              handleResultsToggle={handleResultsToggle}
              handleStatisticsToggle={handleStatisticsToggle}
              handleReportCardsToggle={handleReportCardsToggle}
              onLogout={onLogout} 
            />
          </div>
        </div>
      </div>
    </>
  );
};

// Separate component for sidebar content to avoid duplication
const SidebarContent: React.FC<{
  staffInfo: any;
  menuItems: any[];
  isActive: (path: string) => boolean;
  isResultsActive: () => boolean;
  isResultsOpen: boolean;
  isStatisticsActive: () => boolean;
  isStatisticsOpen: boolean;
  isReportCardsActive: () => boolean;
  isReportCardsOpen: boolean;
  handleNavigation: (path: string) => void;
  handleResultsToggle: () => void;
  handleStatisticsToggle: () => void;
  handleReportCardsToggle: () => void;
  onLogout: () => void;
}> = ({ staffInfo, menuItems, isActive, isResultsActive, isResultsOpen, isStatisticsActive, isStatisticsOpen, isReportCardsActive, isReportCardsOpen, handleNavigation, handleResultsToggle, handleStatisticsToggle, handleReportCardsToggle, onLogout }) => {
  return (
    <>
      {/* Logo/School Info */}
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-white">Staff Portal</h1>
          <p className="text-sm text-indigo-200 truncate">{staffInfo.school_name}</p>
        </div>
      </div>

      {/* Staff Info */}
      <div className="mt-6 px-4 pb-4 border-b border-indigo-600">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {staffInfo.full_name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{staffInfo.full_name}</p>
            <p className="text-xs text-indigo-200 truncate">{staffInfo.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {menuItems.map((item) => (
          <div key={item.name}>
            {item.hasDropdown ? (
              <>
                <button
                  onClick={
                    item.name === 'Results' ? handleResultsToggle : 
                    item.name === 'Statistics' ? handleStatisticsToggle :
                    item.name === 'Report Cards' ? handleReportCardsToggle :
                    handleStatisticsToggle
                  }
                  className={`${
                    (item.name === 'Results' ? isResultsActive() : 
                     item.name === 'Statistics' ? isStatisticsActive() :
                     item.name === 'Report Cards' ? isReportCardsActive() :
                     false)
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                  } group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full transition-colors`}
                >
                  <div className="flex items-center">
                    <span className="mr-3 flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      (item.name === 'Results' ? isResultsOpen : 
                       item.name === 'Statistics' ? isStatisticsOpen :
                       item.name === 'Report Cards' ? isReportCardsOpen :
                       false) ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {(item.name === 'Results' ? isResultsOpen : 
                  item.name === 'Statistics' ? isStatisticsOpen :
                  item.name === 'Report Cards' ? isReportCardsOpen :
                  false) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems?.map((subItem: any) => (
                      <button
                        key={subItem.name}
                        onClick={() => handleNavigation(subItem.path)}
                        className={`${
                          isActive(subItem.path)
                            ? 'bg-indigo-800 text-white'
                            : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors`}
                      >
                        <span className="mr-3 flex-shrink-0">{subItem.icon}</span>
                        <span className="truncate">{subItem.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => handleNavigation(item.path)}
                className={`${
                  isActive(item.path)
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors`}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-2 pb-4">
        <button
          onClick={onLogout}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-indigo-100 hover:bg-red-600 hover:text-white w-full transition-colors"
        >
          <svg className="mr-3 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="truncate">Logout</span>
        </button>
      </div>
    </>
  );
};

export default StaffSidebar;

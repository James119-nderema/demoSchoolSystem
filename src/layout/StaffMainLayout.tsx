import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/sidebars/StaffSidebar';
import TopNavbar from '../components/layout/TopNavbar';
import { clearAuthData } from '../utils/authUtils';

interface StaffInfo {
  id: string;
  email: string;
  full_name: string;
  school_id: number;
  school_name: string;
  phone_number: string;
  role?: string;
}

const StaffMainLayout: React.FC = () => {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [userType, setUserType] = useState<'staff' | 'school' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for staff login first
    const staffToken = localStorage.getItem('staff_access_token');
    const staffInfoData = localStorage.getItem('staff_info');

    if (staffToken && staffInfoData) {
      try {
        const parsed = JSON.parse(staffInfoData);
        setStaffInfo({
          id: parsed.id,
          email: parsed.email,
          full_name: parsed.full_name,
          school_id: parsed.school_id,
          school_name: parsed.school_name,
          phone_number: parsed.phone_number || '',
          role: parsed.role
        });
        setUserType('staff');
        return;
      } catch (error) {
        console.error('Error parsing staff info:', error);
      }
    }

    // Check for school admin login
    const schoolToken = localStorage.getItem('access_token');
    const schoolInfoData = localStorage.getItem('school_info');

    if (schoolToken && schoolInfoData) {
      try {
        const parsed = JSON.parse(schoolInfoData);
        setStaffInfo({
          id: String(parsed.id),
          email: parsed.email,
          full_name: parsed.principal_name || parsed.name || 'School Administrator',
          school_id: parsed.id,
          school_name: parsed.name,
          phone_number: '',
          role: 'ADMINISTRATIVE_STAFF'
        });
        setUserType('school');
        return;
      } catch (error) {
        console.error('Error parsing school info:', error);
      }
    }

    // No valid login found
    navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    if (userType === 'staff') {
      clearAuthData('staff');
    } else if (userType === 'school') {
      clearAuthData('school');
    }
    // Clear both just to be safe
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_info');
    localStorage.removeItem('access_token');
    localStorage.removeItem('school_info');
    navigate('/login');
  };

  if (!staffInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-100 overflow-hidden">
      {/* Sidebar Component */}
      <StaffSidebar staffInfo={staffInfo} onLogout={handleLogout} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar with profile dropdown */}
        <TopNavbar staffInfo={staffInfo} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffMainLayout;

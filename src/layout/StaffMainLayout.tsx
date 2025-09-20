import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/sidebars/StaffSidebar';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { clearAuthData } from '../utils/authUtils';

interface StaffInfo {
  id: string;
  email: string;
  full_name: string;
  school_id: number;
  school_name: string;
  phone_number: string;
}

const StaffMainLayout: React.FC = () => {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const navigate = useNavigate();
  
  // Use authentication validation hook
  useAuthValidation('staff');

  useEffect(() => {
    // Check if staff is logged in
    const token = localStorage.getItem('staff_access_token');
    const info = localStorage.getItem('staff_info');

    if (!token || !info) {
      navigate('/staff/login');
      return;
    }

    try {
      setStaffInfo(JSON.parse(info));
    } catch (error) {
      console.error('Error parsing staff info:', error);
      navigate('/staff/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    clearAuthData('staff');
    navigate('/staff/login');
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
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffMainLayout;

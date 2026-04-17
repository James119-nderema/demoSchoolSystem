import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface TopNavbarProps {
  staffInfo: {
    id: string;
    email: string;
    full_name: string;
    school_name: string;
    phone_number: string;
    role?: string;
  };
  onLogout: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ staffInfo, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const permissions = usePermissions();

  const avatarSeed = encodeURIComponent((staffInfo.full_name || staffInfo.email || 'staff').trim());
  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${avatarSeed}&radius=50&backgroundType=gradientLinear`;

  const roleLabel =
    staffInfo.role
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Staff';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="hidden md:flex bg-white border-b border-slate-200/80 shrink-0 h-14 items-center justify-between px-6 z-20">
      {/* Left side — breadcrumb / school name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-[13px] font-semibold text-slate-700 truncate">
          {staffInfo.school_name}
        </h2>
      </div>

      {/* Right side — profile avatar & dropdown */}
      <div className="flex items-center gap-4">
        {/* Optional: quick info */}
        <span className="text-xs text-slate-400 hidden lg:block">{staffInfo.email}</span>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-all duration-200 group"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full border-2 border-indigo-100 overflow-hidden bg-white shadow-sm shadow-indigo-200/60 group-hover:shadow-md group-hover:shadow-indigo-200/80 transition-shadow">
              <img
                src={avatarUrl}
                alt={`${staffInfo.full_name} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-slate-700 leading-tight truncate max-w-[140px]">
                {staffInfo.full_name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">{roleLabel}</p>
            </div>
            {/* Chevron */}
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Profile header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-100 overflow-hidden bg-white shadow-md shadow-indigo-200/50">
                    <img
                      src={avatarUrl}
                      alt={`${staffInfo.full_name} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{staffInfo.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{staffInfo.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                {/* My Profile */}
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <span>My Profile</span>
                    <p className="text-[10px] text-slate-400 font-normal">View and edit your personal info</p>
                  </div>
                </button>

                {/* School Profile — show for admins */}
                {permissions.isAdministrativeStaff() && (
                  <button
                    onClick={() => {
                      navigate('/school-profile');
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <span>School Profile</span>
                      <p className="text-[10px] text-slate-400 font-normal">Manage school information</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 pt-1.5">
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <svg className="w-[18px] h-[18px] text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;

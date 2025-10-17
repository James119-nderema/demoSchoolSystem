import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import TimeSlot from './Time/TimeSlot';

interface TimetableTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const TimetableDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('time');

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/staff/timetable' || path.includes('/time')) {
      setActiveTab('time');
    } else if (path.includes('/schedule')) {
      setActiveTab('schedule');
    } else if (path.includes('/classes')) {
      setActiveTab('classes');
    } else if (path.includes('/subjects')) {
      setActiveTab('subjects');
    } else {
      setActiveTab('time'); // default
    }
  }, [location.pathname]);

  const tabs: TimetableTab[] = [
    {
      id: 'time',
      name: 'Time Slots',
      icon: <Clock className="w-4 h-4" />,
      component: <TimeSlot title="Time Management" subtitle="Manage class time slots and schedules" />
    },
    {
      id: 'schedule',
      name: 'Schedule',
      icon: <Calendar className="w-4 h-4" />,
      component: <div className="p-6 text-center text-gray-500">Schedule management coming soon...</div>
    },
    {
      id: 'classes',
      name: 'Class Timetable',
      icon: <Users className="w-4 h-4" />,
      component: <div className="p-6 text-center text-gray-500">Class timetable coming soon...</div>
    },
    {
      id: 'subjects',
      name: 'Subject Schedule',
      icon: <BookOpen className="w-4 h-4" />,
      component: <div className="p-6 text-center text-gray-500">Subject schedule coming soon...</div>
    }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'time') {
      navigate(`/staff/timetable`);
    } else {
      navigate(`/staff/timetable/${tabId}`);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
            <p className="text-gray-600">Manage schedules, time slots, and class timetables</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default TimetableDashboard;

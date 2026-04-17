import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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



  return (
    <div className="h-full bg-gray-50">
      {/* Header */}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="px-6">
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

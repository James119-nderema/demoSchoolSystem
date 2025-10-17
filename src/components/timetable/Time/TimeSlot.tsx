import React from 'react';
import TimeManagement from './TimeManagement';

interface TimeSlotProps {
  title?: string;
  subtitle?: string;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ title, subtitle }) => {
  return (
    <TimeManagement 
      title={title || "Time Slots"}
      subtitle={subtitle || "Manage class time slots and schedules"}
    />
  );
};

export default TimeSlot;

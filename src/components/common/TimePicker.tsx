import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  id?: string;
  use24Hour?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

interface TimeState {
  hour: number;
  minute: number;
  period?: 'AM' | 'PM';
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  id,
  use24Hour = true,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [timeState, setTimeState] = useState<TimeState>({
    hour: 8,
    minute: 0,
    period: 'AM',
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value && !isInitialized) {
      const [hourStr, minuteStr] = value.split(':');
      const hour24 = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (use24Hour) {
        setTimeState({
          hour: hour24,
          minute,
        });
      } else {
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const period = hour24 >= 12 ? 'PM' : 'AM';
        setTimeState({
          hour: hour12,
          minute,
          period,
        });
      }
      setIsInitialized(true);
    }
  }, [value, use24Hour, isInitialized]);

  // Update parent component when time changes (but not during initialization)
  useEffect(() => {
    if (!isInitialized) return;

    let hour24: number;
    
    if (use24Hour) {
      hour24 = timeState.hour;
    } else {
      if (timeState.hour === 12) {
        hour24 = timeState.period === 'AM' ? 0 : 12;
      } else {
        hour24 = timeState.period === 'AM' ? timeState.hour : timeState.hour + 12;
      }
    }

    const timeString = `${hour24.toString().padStart(2, '0')}:${timeState.minute.toString().padStart(2, '0')}`;
    
    // Only call onChange if the value has actually changed
    if (timeString !== value) {
      onChange(timeString);
    }
  }, [timeState, use24Hour, isInitialized, onChange, value]);

  const hours = useMemo(() => use24Hour 
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1), [use24Hour]);

  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const handleHourChange = (hour: number) => {
    setTimeState(prev => ({ ...prev, hour }));
  };

  const handleMinuteChange = (minute: number) => {
    setTimeState(prev => ({ ...prev, minute }));
  };

  const handlePeriodChange = (period: 'AM' | 'PM') => {
    setTimeState(prev => ({ ...prev, period }));
  };

  const formatDisplayTime = () => {
    if (use24Hour) {
      return `${timeState.hour.toString().padStart(2, '0')}:${timeState.minute.toString().padStart(2, '0')}`;
    } else {
      return `${timeState.hour}:${timeState.minute.toString().padStart(2, '0')} ${timeState.period}`;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <Clock className="w-4 h-4 text-gray-400" />
          
          {/* Hour Selector */}
          <div className="relative">
            <select
              id={id}
              value={timeState.hour}
              onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
              disabled={disabled}
              className="appearance-none bg-transparent border-none text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 pr-6"
              style={{ backgroundImage: 'none' }}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {use24Hour ? hour.toString().padStart(2, '0') : hour}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-gray-500 font-medium">:</span>

          {/* Minute Selector */}
          <div className="relative">
            <select
              id={id ? `${id}-minute` : undefined}
              value={timeState.minute}
              onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
              disabled={disabled}
              className="appearance-none bg-transparent border-none text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 pr-6"
              style={{ backgroundImage: 'none' }}
            >
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {minute.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Period Selector (12-hour format only) */}
          {!use24Hour && (
            <>
              <span className="text-gray-300">|</span>
              <div className="relative">
                <select
                  id={id ? `${id}-period` : undefined}
                  value={timeState.period}
                  onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
                  disabled={disabled}
                  className="appearance-none bg-transparent border-none text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 pr-6"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </>
          )}

          {/* Display Selected Time */}
          <div className="ml-auto text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
            {formatDisplayTime()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
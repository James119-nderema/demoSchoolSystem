import React, { useState } from 'react';
import { ENV } from '../config/environment';

interface EnvironmentSwitcherProps {
  onEnvironmentChange?: (env: string) => void;
}

export const EnvironmentSwitcher: React.FC<EnvironmentSwitcherProps> = ({ 
  onEnvironmentChange 
}) => {
  const [currentEnv, setCurrentEnv] = useState(ENV.NODE_ENV);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const environments = [
    { key: 'development', name: 'Local Development', color: 'bg-green-500' },
    { key: 'staging', name: 'Staging Server', color: 'bg-yellow-500' },
    { key: 'production', name: 'Production Server', color: 'bg-red-500' },
    { key: 'test', name: 'Test Environment', color: 'bg-blue-500' }
  ];

  const handleEnvironmentChange = (envKey: string) => {
    ENV.setEnvironment(envKey as keyof typeof ENV.API);
    setCurrentEnv(envKey);
    onEnvironmentChange?.(envKey);
    setShowSwitcher(false);
    
    // Show toast or notification
    console.log(`🔄 Switched to ${envKey} environment`);
  };

  const currentEnvConfig = ENV.getCurrentApiConfig();

  // Only show in development mode
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Environment Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            environments.find(e => e.key === currentEnv)?.color || 'bg-gray-500'
          }`}
        />
        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
          {currentEnvConfig.NAME}
        </span>
      </div>

      {/* Switcher Button */}
      <button
        onClick={() => setShowSwitcher(!showSwitcher)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        title="Switch Environment (Dev Only)"
      >
        🔧 ENV
      </button>

      {/* Environment Options */}
      {showSwitcher && (
        <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-2 min-w-48">
          <div className="text-xs text-gray-500 mb-2 px-2">Switch Environment:</div>
          {environments.map((env) => (
            <button
              key={env.key}
              onClick={() => handleEnvironmentChange(env.key)}
              className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 ${
                currentEnv === env.key ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${env.color}`} />
              <div>
                <div className="font-medium">{env.name}</div>
                <div className="text-xs text-gray-500">
                  {ENV.API[env.key as keyof typeof ENV.API]?.BASE_URL}
                </div>
              </div>
            </button>
          ))}
          
          <hr className="my-2" />
          
          {/* Current Environment Info */}
          <div className="px-3 py-2 text-xs text-gray-600">
            <div><strong>Current:</strong> {currentEnvConfig.BASE_URL}</div>
            <div><strong>Timeout:</strong> {currentEnvConfig.TIMEOUT}ms</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentSwitcher;
